# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2020
- **Module**: ESNext
- **Strict mode**: Enabled
- **No unused locals/parameters**: Enforced
- **Path aliases**: `@/*` maps to `src/*`

## Frontend Conventions
- **React**: Functional components with hooks
- **File naming**: PascalCase for components (e.g., `Dashboard.tsx`)
- **Component structure**: 
  - Named exports for utilities
  - Default exports for page components
- **State management**: React Context API
- **Styling**: Chakra UI components with Emotion
- **API calls**: Centralized in `services/` directory

## Backend Conventions
- **File naming**: camelCase for files (e.g., `timeEntries.ts`)
- **Module system**: ES modules (`type: "module"` in package.json)
- **Error handling**: Custom `AppError` class
- **Middleware pattern**: Auth middleware for protected routes
- **Database**: Migrating from MongoDB/Mongoose to Firestore
- **Controllers**: Separate files for MongoDB and Firestore implementations

## General Conventions
- **Indentation**: 2 spaces
- **Quotes**: Single quotes preferred
- **Semicolons**: Used consistently
- **Async/Await**: Preferred over promise chains
- **Error handling**: Try-catch blocks with proper error messages
- **Comments**: Minimal, code should be self-documenting
- **Imports**: Grouped by external, internal, and relative

## Testing
- **E2E tests**: Playwright with TypeScript
- **Unit tests**: Jest for backend
- **Test files**: `.test.ts` or `.spec.ts` suffix