# Snowflake Sankey Visualization Application

## Overview
An Angular-based web application that connects to Snowflake database via Azure AD SSO authentication. Users can apply dynamic categorical filters to visualize data in an interactive Sankey diagram with color-coded bands.

## Current State
- **Status**: MVP Complete - Ready for Configuration and Deployment
- Created: October 25, 2025
- Stack: Angular 17+ (frontend) + Node.js/Express (backend)
- Authentication: Azure AD SSO using MSAL with JWT validation
- Database: Snowflake with async connection (connectasync)
- Visualization: D3.js Sankey diagram with color-coded bands
- Workflows: Both backend (port 3000) and frontend (port 5000) running

## Architecture

### Frontend (Angular)
- Location: `/frontend`
- Framework: Angular 17+
- Key Features:
  - Azure AD authentication with MSAL
  - Dynamic categorical filter UI
  - Interactive Sankey diagram
  - Click actions to modify filters

### Backend (Node.js/Express)
- Location: `/backend`
- Framework: Express.js
- Key Features:
  - Snowflake connection using `connectasync()`
  - Azure AD token validation
  - API endpoints for filtered query execution
  - CORS enabled for separate server deployment

## Data Flow
1. User authenticates via Azure AD SSO
2. UI presents categorical filters
3. Backend executes predefined Snowflake query with dynamic filter parameters
4. Query returns: source, target, value, and dimensional attributes
5. Sankey diagram renders with color-coded bands based on value splits
6. Click actions update filters and refresh visualization

## Environment Variables Required
- `SNOWFLAKE_ACCOUNT`: Snowflake account identifier
- `SNOWFLAKE_USERNAME`: Snowflake username
- `SNOWFLAKE_PASSWORD`: Snowflake password (or use Azure AD auth)
- `SNOWFLAKE_DATABASE`: Database name
- `SNOWFLAKE_SCHEMA`: Schema name
- `SNOWFLAKE_WAREHOUSE`: Warehouse name
- `AZURE_AD_CLIENT_ID`: Azure AD application client ID
- `AZURE_AD_TENANT_ID`: Azure AD tenant ID
- `AZURE_AD_CLIENT_SECRET`: Azure AD client secret
- `SESSION_SECRET`: Session encryption secret (already available)

## Recent Changes
- 2025-10-25: Complete MVP implementation
  - Angular 17 application with MSAL authentication
  - Node.js/Express backend with JWT token validation
  - Snowflake SDK integration with connectasync()
  - Interactive D3.js Sankey diagram
  - Dynamic categorical filter panel
  - Click-to-filter interactions
  - Comprehensive configuration documentation
  - Security packages: jsonwebtoken, jwks-rsa
  - Both workflows configured and running

## User Preferences
- Deployment: Application will be hosted on a separate server (not Replit deployment)
- Authentication: Azure AD SSO required
- Filters: Categorical fields only
- Color coding: Bands color-coded based on value splits
- Database: Snowflake with connectasync() method

## Next Steps for User
1. Configure Azure AD credentials in environment variables (see CONFIGURATION.md)
2. Set up Snowflake connection details
3. Customize SQL queries to match your table schema (backend/server.js)
4. Update filter fields to match your category columns
5. Customize click-to-filter logic for your data structure (see CONFIGURATION.md examples)
6. Test with your actual data
7. Deploy to your production server
