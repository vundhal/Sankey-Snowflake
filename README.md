# Snowflake Sankey Visualization Application

An Angular-based web application that connects to Snowflake database via Azure AD SSO authentication. Users can apply dynamic categorical filters to visualize data in an interactive Sankey diagram with color-coded bands.

## Architecture

### Frontend (Angular 17+)
- Location: `frontend/sankey-app/`
- Port: 5000 (development)
- Features:
  - Azure AD authentication using MSAL
  - Dynamic categorical filter controls
  - Interactive D3.js Sankey diagram
  - Click interactions to modify filters

### Backend (Node.js/Express)
- Location: `backend/`
- Port: 3000
- Features:
  - Snowflake connection using `connectasync()`
  - Azure AD token validation
  - RESTful API for filtered query execution
  - CORS enabled for frontend communication

## Setup Instructions

### Prerequisites
- Node.js 20+
- Snowflake account with appropriate credentials
- Azure AD application registration

### Environment Configuration

1. Copy `.env.example` to `.env` in the root directory
2. Fill in your credentials:

```bash
SNOWFLAKE_ACCOUNT=your-account.snowflakecomputing.com
SNOWFLAKE_USERNAME=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=your-database
SNOWFLAKE_SCHEMA=your-schema
SNOWFLAKE_WAREHOUSE=your-warehouse

AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret

SESSION_SECRET=your-session-secret
```

3. Update `frontend/sankey-app/src/app/auth.config.ts` with your Azure AD details:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_AZURE_AD_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    ...
  },
  ...
};
```

### Database Schema

Update the SQL queries in `backend/server.js` to match your Snowflake table structure:

- **Filter Categories Endpoint** (`/api/filters/categories`):
  - Update table name: `YOUR_TABLE_NAME`
  - Update category fields: `CATEGORY_FIELD_1`, `CATEGORY_FIELD_2`, `CATEGORY_FIELD_3`

- **Sankey Data Endpoint** (`/api/data/sankey`):
  - Update table name: `YOUR_TABLE_NAME`
  - Expected columns:
    - `SOURCE`: Source node name
    - `TARGET`: Target node name
    - `VALUE`: Flow value between nodes
    - `SOURCE_ATTRIBUTE`: Additional source metadata (optional)
    - `TARGET_ATTRIBUTE`: Additional target metadata (optional)
    - `VALUE_SPLIT_CATEGORY`: Category for color-coding bands

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/sankey-app
npm install
```

### Running the Application

**Development (Replit):**
The application runs automatically with configured workflows:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5000`

**Manual Start:**

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend/sankey-app
npm start
```

### Deployment

For production deployment on your own server:

1. **Build the Angular application:**
```bash
cd frontend/sankey-app
ng build --configuration production
```

2. **Deploy the backend:**
   - Use a process manager like PM2
   - Configure reverse proxy (nginx/Apache)
   - Set up SSL certificates

3. **Deploy the frontend:**
   - Serve the `dist/` folder with a web server
   - Configure proper CORS settings
   - Update API base URL for production

## API Endpoints

### Authentication
- `POST /api/auth/token` - Validate Azure AD token
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user

### Data
- `GET /api/filters/categories` - Get available filter categories
- `POST /api/data/sankey` - Get Sankey diagram data with filters

### Health
- `GET /api/health` - Health check endpoint

## Features

### Azure AD SSO Authentication
- Login using Microsoft Azure AD MSAL library
- Token-based authentication with JWT signature verification
- Validates token issuer, audience, and expiration
- Session management

### Dynamic Filters
- Categorical field filtering
- Multiple filter combinations
- Real-time data updates

### Interactive Sankey Diagram
- D3.js-powered visualization
- Color-coded bands based on value categories
- Node click interactions
- Hover tooltips with detailed information
- Responsive design

### Filter Interactions
- Click actions modify active filters
- Reset functionality
- Filter state synchronization

## Technology Stack

### Frontend
- Angular 17+
- TypeScript
- D3.js & d3-sankey
- MSAL Browser (@azure/msal-browser, @azure/msal-angular)
- RxJS

### Backend
- Node.js 20+
- Express.js
- Snowflake SDK (with connectasync support)
- MSAL Node (@azure/msal-node)
- CORS, dotenv, express-session

## Troubleshooting

### Connection Issues
- Verify Snowflake credentials in `.env`
- Check network connectivity to Snowflake
- Ensure warehouse is running

### Authentication Issues
- Verify Azure AD application registration
- Check redirect URIs match your application URL
- Ensure API permissions are granted

### Data Not Loading
- Check backend logs for Snowflake connection errors
- Verify SQL queries match your table schema
- Check browser console for CORS errors

## License

ISC
