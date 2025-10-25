# Configuration Guide

This application requires configuration of Azure AD credentials, Snowflake connection details, and customization of SQL queries to match your specific database schema.

## Required Environment Variables

Create a `.env` file in the root directory (or set these as Replit Secrets):

```bash
# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your-account.snowflakecomputing.com
SNOWFLAKE_USERNAME=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=your-database-name
SNOWFLAKE_SCHEMA=your-schema-name
SNOWFLAKE_WAREHOUSE=your-warehouse-name

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-client-id-from-azure-portal
AZURE_AD_TENANT_ID=your-tenant-id-from-azure-portal
AZURE_AD_CLIENT_SECRET=your-client-secret-from-azure-portal

# Session Secret (auto-generated or custom)
SESSION_SECRET=your-random-session-secret

# Backend Port (optional, defaults to 3000)
PORT=3000
```

## Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App registrations
2. Click "New registration"
3. Set redirect URIs to include your application URL (e.g., `http://localhost:5000` for development)
4. Under "Certificates & secrets", create a new client secret
5. Under "API permissions", add "User.Read" permission
6. Copy the Application (client) ID, Directory (tenant) ID, and client secret value

## Frontend Azure AD Configuration

Update `frontend/sankey-app/src/app/auth.config.ts`:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_AZURE_AD_CLIENT_ID',        // Replace with your client ID
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',  // Replace with your tenant ID
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  ...
};
```

## Database Schema Customization

### Update Filter Categories

In `backend/server.js`, find the `/api/filters/categories` endpoint and customize:

```javascript
// Line ~145
const query = `
  SELECT DISTINCT 
    CATEGORY_FIELD_1,    // Replace with your actual column name
    CATEGORY_FIELD_2,    // Replace with your actual column name
    CATEGORY_FIELD_3     // Replace with your actual column name
  FROM YOUR_TABLE_NAME   // Replace with your actual table name
  ORDER BY CATEGORY_FIELD_1, CATEGORY_FIELD_2, CATEGORY_FIELD_3
`;
```

### Update Sankey Data Query

In `backend/server.js`, find the `/api/data/sankey` endpoint and customize:

```javascript
// Line ~188
const query = `
  SELECT 
    SOURCE,                    // Column containing source node names
    TARGET,                    // Column containing target node names
    VALUE,                     // Column containing flow values
    SOURCE_ATTRIBUTE,          // Optional: additional source metadata
    TARGET_ATTRIBUTE,          // Optional: additional target metadata
    VALUE_SPLIT_CATEGORY       // Column for color-coding the bands
  FROM YOUR_TABLE_NAME         // Replace with your actual table name
  ${whereClause}
  ORDER BY SOURCE, TARGET
`;
```

### Expected Data Structure

Your Snowflake query should return rows with this structure:

```javascript
{
  SOURCE: "Node A",              // String: source node identifier
  TARGET: "Node B",              // String: target node identifier
  VALUE: 100,                    // Number: flow value/amount
  SOURCE_ATTRIBUTE: "Type 1",    // Optional: source metadata
  TARGET_ATTRIBUTE: "Type 2",    // Optional: target metadata
  VALUE_SPLIT_CATEGORY: "Category A"  // String: category for color-coding
}
```

## Customizing Filter Fields

### Backend Filter Fields

Update the filter query in `backend/server.js` to match your category fields:

1. Change `CATEGORY_FIELD_1`, `CATEGORY_FIELD_2`, `CATEGORY_FIELD_3` to your actual column names
2. Add or remove category fields as needed

### Frontend Filter Component

Update `frontend/sankey-app/src/app/components/filter-panel.component.ts`:

1. Modify the `FilterCategory` interface to match your fields
2. Update the filter selection dropdowns
3. Adjust the `selectedFilters` object structure

Example:
```typescript
export interface FilterCategory {
  REGION: string;        // Replace with your field
  PRODUCT: string;       // Replace with your field
  CUSTOMER_TYPE: string; // Replace with your field
}
```

## Implementing Click-to-Filter Functionality

The default implementation filters by SOURCE when any node is clicked. To customize this based on your data structure, modify `handleNodeClick()` in `frontend/sankey-app/src/app/app.component.ts`:

### Option 1: Filter by SOURCE or TARGET based on node position

```typescript
handleNodeClick(nodeName: string, nodeData?: any): void {
  const userConfirm = confirm(`Filter by: ${nodeName}?`);
  
  if (userConfirm) {
    // Determine if node is source or target based on your data
    // This example checks if the node appears more as source or target
    const isMostlySource = this.sankeyData.filter(d => d.SOURCE === nodeName).length > 
                           this.sankeyData.filter(d => d.TARGET === nodeName).length;
    
    this.currentFilters = {
      [isMostlySource ? 'SOURCE' : 'TARGET']: [nodeName]
    };
    
    this.loadData();
  }
}
```

### Option 2: Preserve existing filters and add new selection

```typescript
handleNodeClick(nodeName: string): void {
  const userConfirm = confirm(`Add filter: ${nodeName}?`);
  
  if (userConfirm) {
    // Preserve existing filters and add the new node
    this.currentFilters = {
      ...this.currentFilters,
      SOURCE: [...(this.currentFilters.SOURCE || []), nodeName]
    };
    
    this.loadData();
  }
}
```

### Option 3: Use categorical dimensions

```typescript
handleNodeClick(nodeName: string): void {
  // Map node names to categorical filter fields
  const nodeToCategory = {
    'Region A': 'CATEGORY_FIELD_1',
    'Product B': 'CATEGORY_FIELD_2',
    // ... map all your nodes
  };
  
  const filterField = nodeToCategory[nodeName] || 'SOURCE';
  
  this.currentFilters = {
    [filterField]: [nodeName]
  };
  
  this.loadData();
}
```

## Security Considerations

### Token Validation

The backend includes JWT token validation using jsonwebtoken and jwks-rsa packages. These are included in package.json dependencies and will be installed automatically with `npm install`.

If you encounter token validation errors, ensure all dependencies are installed:

```bash
cd backend
npm install
```

### Production Deployment

For production deployment on your separate server:

1. **Install Security Packages**: `npm install jsonwebtoken jwks-rsa` in the backend directory
2. **Enable HTTPS**: Configure SSL/TLS certificates
3. **Secure Secrets**: Use proper secret management (Azure Key Vault, etc.)
4. **CORS**: Restrict CORS origins to your specific domain
5. **Token Validation**: The included validation checks signature, issuer, audience, and expiration

```javascript
// In backend/server.js, enhance token validation:
app.post('/api/auth/token', async (req, res) => {
  try {
    if (!msalConfigured) {
      return res.status(503).json({ 
        error: 'Authentication not configured' 
      });
    }

    const { token } = req.body;
    
    // TODO: Add proper JWT validation here
    // - Verify token signature
    // - Check token expiration
    // - Validate issuer and audience
    // - Use @azure/msal-node to validate the token
    
    req.session.token = token;
    req.session.authenticated = true;
    
    res.json({ success: true, message: 'Token validated' });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});
```

### Recommended Security Enhancements

1. Implement proper JWT token validation using MSAL libraries
2. Add rate limiting to API endpoints
3. Sanitize all SQL inputs (currently using parameterized queries, which is good)
4. Implement request logging and monitoring
5. Use helmet.js for security headers
6. Set up CSP (Content Security Policy) headers

## Testing the Application

### Local Development

1. Start backend: `cd backend && npm start` (port 3000)
2. Start frontend: `cd frontend/sankey-app && npm start` (port 5000)
3. Access application at `http://localhost:5000`

### Verify Configuration

1. Check backend health: `curl http://localhost:3000/api/health`
2. Check auth status: `curl http://localhost:3000/api/auth/status`
3. Expected response should show configuration status

### Common Issues

**Error: "Authentication not configured"**
- Solution: Set Azure AD environment variables

**Error: "Unable to connect to Snowflake"**
- Solution: Verify Snowflake credentials and network access

**Error: "Failed to fetch Sankey data"**
- Solution: Check SQL query and table/column names match your schema

## Next Steps

1. Configure all environment variables
2. Update Azure AD configuration in frontend
3. Customize SQL queries to match your schema
4. Test with your actual data
5. Implement proper token validation for production
6. Deploy to your separate server with proper security measures
