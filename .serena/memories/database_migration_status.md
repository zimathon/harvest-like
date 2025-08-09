# Database Migration Status

## Current State
The project is in the process of migrating from MongoDB to Firestore:

### MongoDB (Legacy)
- Original database system
- Uses Mongoose for ODM
- Controllers in `server/src/controllers/*.ts`
- Routes in `server/src/routes/*.ts`
- Models in `server/src/models/*.ts`

### Firestore (New)
- Target database system
- Uses Firebase Admin SDK
- Controllers in `server/src/controllers/*.firestore.ts`
- Routes in `server/src/routes/*.firestore.ts`
- Models in `server/src/models/firestore/`
- Configuration in `server/src/config/firestore.ts`

### Migration Tools
- Migration script: `server/src/scripts/migrate-to-firestore.ts`
- Firestore emulator for local development
- Parallel implementations allow gradual migration

### Current Features
Both database systems support:
- User authentication
- Time entries
- Clients
- Projects
- Expenses
- Invoices
- Reports

### Development Approach
- New features should be implemented for Firestore
- Maintain backward compatibility with MongoDB during migration
- Use Firestore emulator for local development
- Test both implementations when modifying shared code