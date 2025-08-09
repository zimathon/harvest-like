# Firestore Migration and Testing Guide

This guide explains how to test the Firestore implementation locally and migrate data from MongoDB.

## Prerequisites

1. Make sure you have the Firebase emulator installed:
```bash
npm install -g firebase-tools
```

2. Ensure MongoDB is running (via Docker or locally)

3. Build the TypeScript files:
```bash
npm run build
```

## Testing Firestore Locally

### 1. Start the Firestore Emulator

In a separate terminal, run:
```bash
npm run firestore:start
```

This will start the Firestore emulator on `http://localhost:8090`

### 2. Start the Backend Server

In another terminal, run:
```bash
npm run dev
```

The server will start with both MongoDB (v1) and Firestore (v2) endpoints available.

### 3. Run Feature Tests

To test all Firestore features:
```bash
npm run test:firestore:features
```

This script will:
- Register a new user
- Test authentication
- Create and manage clients
- Create and manage projects
- Create time entries and test timer functionality
- Clean up test data

### 4. Test Basic Firestore Connection

To test basic Firestore model operations:
```bash
npm run test:firestore
```

## Data Migration

To migrate existing data from MongoDB to Firestore:

```bash
npm run migrate:firestore
```

This script will:
1. Connect to both MongoDB and Firestore
2. Migrate all users (preserving hashed passwords)
3. Migrate all clients (updating user references)
4. Migrate all projects (updating user and client references)
5. Migrate all time entries (updating all references)
6. Display a migration summary

## API Endpoints

The Firestore implementation provides parallel API endpoints:

### MongoDB (v1) - Original endpoints
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/projects/*` - Project management
- `/api/time-entries/*` - Time tracking
- `/api/clients/*` - Client management

### Firestore (v2) - New endpoints
- `/api/v2/auth/*` - Authentication
- `/api/v2/users/*` - User management
- `/api/v2/projects/*` - Project management
- `/api/v2/time-entries/*` - Time tracking
- `/api/v2/clients/*` - Client management

## Frontend Migration

To migrate the frontend to use Firestore endpoints:

1. Update the API base URL in your frontend configuration
2. Change API calls from `/api/*` to `/api/v2/*`
3. Test all features thoroughly

## Troubleshooting

### Firestore Emulator Issues
- Ensure the emulator is running on port 8090
- Check that `FIRESTORE_EMULATOR_HOST=localhost:8090` is set
- Verify Firebase tools are installed globally

### Migration Issues
- Ensure MongoDB has data to migrate
- Check that all user references exist
- Verify client and project relationships

### Testing Issues
- Make sure the server is running before running tests
- Check that the Firestore emulator is running
- Verify all dependencies are installed

## Environment Variables

Make sure your `.env` file includes:
```
NODE_ENV=development
FIRESTORE_EMULATOR_HOST=localhost:8090
```

## Next Steps

1. Run all tests to ensure Firestore implementation works correctly
2. Migrate a copy of production data for testing
3. Update frontend to use v2 endpoints
4. Test thoroughly before switching production to Firestore
5. Consider implementing Expenses and Invoices controllers if needed