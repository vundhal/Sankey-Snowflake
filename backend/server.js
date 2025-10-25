require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const snowflake = require('snowflake-sdk');
const msal = require('@azure/msal-node');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

let cca = null;

function initializeMSAL() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (clientId && tenantId && clientSecret) {
    const msalConfig = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret: clientSecret
      }
    };
    cca = new msal.ConfidentialClientApplication(msalConfig);
    console.log('Azure AD MSAL configured successfully');
    return true;
  } else {
    console.warn('Warning: Azure AD credentials not configured. Authentication will not work.');
    console.warn('Please set AZURE_AD_CLIENT_ID, AZURE_AD_TENANT_ID, and AZURE_AD_CLIENT_SECRET in your environment.');
    return false;
  }
}

const msalConfigured = initializeMSAL();

const snowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USERNAME || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  database: process.env.SNOWFLAKE_DATABASE || '',
  schema: process.env.SNOWFLAKE_SCHEMA || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || ''
};

let snowflakeConnection = null;

async function getSnowflakeConnection() {
  if (snowflakeConnection && snowflakeConnection.isUp()) {
    return snowflakeConnection;
  }

  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(snowflakeConfig);
    
    connection.connectAsync((err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake:', err);
        reject(err);
      } else {
        console.log('Successfully connected to Snowflake');
        snowflakeConnection = conn;
        resolve(conn);
      }
    });
  });
}

function executeQuery(connection, sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sqlText,
      binds: binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    });
  });
}

app.post('/api/auth/token', async (req, res) => {
  try {
    if (!msalConfigured) {
      return res.status(503).json({ 
        error: 'Authentication not configured', 
        message: 'Azure AD credentials are not set up. Please configure environment variables.' 
      });
    }

    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const jwksClient = require('jwks-rsa');
      
      const client = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`
      });
      
      function getKey(header, callback) {
        client.getSigningKey(header.kid, function(err, key) {
          if (err) {
            callback(err);
            return;
          }
          const signingKey = key.publicKey || key.rsaPublicKey;
          callback(null, signingKey);
        });
      }
      
      jwt.verify(token, getKey, {
        audience: process.env.AZURE_AD_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err.message);
          return res.status(401).json({ error: 'Invalid token', details: err.message });
        }
        
        req.session.token = token;
        req.session.authenticated = true;
        req.session.userInfo = {
          email: decoded.preferred_username || decoded.email,
          name: decoded.name,
          oid: decoded.oid
        };
        
        res.json({ 
          success: true, 
          message: 'Token validated',
          user: req.session.userInfo
        });
      });
    } catch (jwtError) {
      console.error('JWT validation error - required libraries not available:', jwtError.message);
      return res.status(503).json({ 
        error: 'Token validation unavailable',
        message: 'JWT validation libraries are not installed. Run: npm install jsonwebtoken jwks-rsa',
        details: jwtError.message
      });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ 
    authenticated: !!req.session.authenticated,
    hasSnowflakeConfig: !!(snowflakeConfig.account && snowflakeConfig.username),
    hasAzureADConfig: msalConfigured
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/filters/categories', async (req, res) => {
  try {
    if (!req.session.authenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const connection = await getSnowflakeConnection();
    
    const query = `
      SELECT DISTINCT 
        CATEGORY_FIELD_1,
        CATEGORY_FIELD_2,
        CATEGORY_FIELD_3
      FROM YOUR_TABLE_NAME
      ORDER BY CATEGORY_FIELD_1, CATEGORY_FIELD_2, CATEGORY_FIELD_3
    `;
    
    const rows = await executeQuery(connection, query);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching filter categories:', error);
    res.status(500).json({ error: 'Failed to fetch filter categories' });
  }
});

app.post('/api/data/sankey', async (req, res) => {
  try {
    if (!req.session.authenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { filters } = req.body;
    const connection = await getSnowflakeConnection();
    
    let whereClause = '';
    const binds = [];
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(filters)) {
        if (value && value.length > 0) {
          conditions.push(`${key} IN (${value.map(() => '?').join(', ')})`);
          binds.push(...value);
        }
      }
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    const query = `
      SELECT 
        SOURCE,
        TARGET,
        VALUE,
        SOURCE_ATTRIBUTE,
        TARGET_ATTRIBUTE,
        VALUE_SPLIT_CATEGORY
      FROM YOUR_TABLE_NAME
      ${whereClause}
      ORDER BY SOURCE, TARGET
    `;
    
    const rows = await executeQuery(connection, query, binds);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Sankey data:', error);
    res.status(500).json({ error: 'Failed to fetch Sankey data' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing Snowflake connection');
  if (snowflakeConnection) {
    await snowflakeConnection.destroy();
  }
  process.exit(0);
});
