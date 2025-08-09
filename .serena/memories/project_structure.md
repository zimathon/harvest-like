# Project Structure

## Root Directory
- `src/` - React frontend application
  - `components/` - Reusable React components
  - `pages/` - Page components (Dashboard, TimeTracking, Reports, etc.)
  - `contexts/` - React Context providers (UserContext, InvoiceContext)
  - `services/` - API service calls
  - `types/` - TypeScript type definitions
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions
  - `assets/` - Static assets
  - `reducers/` - State reducers
- `server/` - Node.js/Express backend
  - `src/` - Backend source code (TypeScript)
    - `controllers/` - Request handlers
    - `routes/` - API route definitions
    - `models/` - Data models (Mongoose & Firestore)
    - `middleware/` - Express middleware (auth, error handling)
    - `config/` - Configuration files
    - `scripts/` - Utility scripts (createAdmin, migration)
    - `types/` - TypeScript type definitions
  - `dist/` - Compiled JavaScript files
- `tests/` - E2E Playwright tests
- `scripts/` - Build and deployment scripts
- `deploy/` - Deployment configurations

## Key Files
- `package.json` - Frontend dependencies and scripts
- `server/package.json` - Backend dependencies and scripts
- `tsconfig.json` - TypeScript configuration for frontend
- `server/tsconfig.json` - TypeScript configuration for backend
- `vite.config.ts` - Vite bundler configuration
- `playwright.config.ts` - E2E test configuration
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase project settings