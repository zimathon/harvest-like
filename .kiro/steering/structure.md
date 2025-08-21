# Project Structure: Harvest-like Time Tracking Application

**Last Updated**: 2025-01-17  
**Inclusion Mode**: Always Included

## Root Directory Organization

```
harvest-like/
├── src/                    # Frontend React application source
├── server/                 # Backend Node.js/Express application
├── api/                    # API specifications and contracts
├── deploy/                 # Deployment configurations and scripts
├── scripts/                # Project-level automation scripts
├── tests/                  # E2E test suites
├── documents/              # Project documentation
├── public/                 # Static assets for frontend
├── dist/                   # Frontend production build output
├── node_modules/           # Frontend dependencies
└── *.md                    # Root-level documentation files
```

## Subdirectory Structures

### Frontend Structure (`src/`)
```
src/
├── components/             # Reusable React components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── ClientModal.tsx    # Client management modal
├── pages/                  # Route-based page components
│   ├── Dashboard.tsx      # Main dashboard view
│   ├── TimeTracking.tsx   # Time entry management
│   ├── Projects.tsx       # Project management
│   ├── Clients.tsx        # Client management
│   ├── Expenses.tsx       # Expense tracking
│   ├── Invoices.tsx       # Invoice generation
│   ├── Reports.tsx        # Analytics and reports
│   ├── Team.tsx           # Team management
│   ├── Manage.tsx         # Admin management
│   └── Login.tsx          # Authentication
├── contexts/               # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── ClientContext.tsx  # Client data management
│   ├── ProjectContext.tsx # Project state
│   └── AppProviders.tsx   # Combined context provider
├── services/               # API communication layer
│   ├── api.ts             # Base API configuration
│   ├── authService.ts     # Authentication API calls
│   ├── clientService.ts   # Client CRUD operations
│   └── projectService.ts  # Project operations
├── hooks/                  # Custom React hooks
│   └── useApi.ts          # Generic API hook
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Manual type definitions
│   └── api.generated.ts   # Auto-generated API types
├── utils/                  # Utility functions
│   └── typeAdapters.ts    # Type conversion utilities
├── lib/                    # External library configurations
│   └── api-client.ts      # API client setup
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── index.css              # Global styles
```

### Backend Structure (`server/src/`)
```
server/src/
├── config/                 # Configuration files
│   ├── environment.ts     # Environment setup
│   ├── firestore.ts       # Firestore configuration
│   ├── firestore-local.ts # Local Firestore config
│   └── firestore-production.ts # Production config
├── controllers/            # Request handlers
│   ├── auth.firestore.ts  # Authentication logic
│   ├── clients.firestore.ts # Client operations
│   ├── projects.firestore.ts # Project management
│   ├── timeEntries.firestore.ts # Time tracking
│   └── *.js               # Legacy MongoDB controllers
├── models/                 # Data models
│   └── firestore/         # Firestore model definitions
│       ├── User.ts        # User model
│       ├── Client.ts      # Client model
│       ├── Project.ts     # Project model
│       └── TimeEntry.ts   # Time entry model
├── routes/                 # API route definitions
│   ├── auth.firestore.ts  # /auth/* routes
│   ├── clients.firestore.ts # /clients/* routes
│   ├── projects.firestore.ts # /projects/* routes
│   └── *.js               # Legacy MongoDB routes
├── middleware/             # Express middleware
│   ├── auth.firestore.ts  # JWT authentication
│   └── cache.ts           # Response caching
├── services/               # Business logic services
│   └── emailService.ts    # Email notifications
├── scripts/                # Utility scripts
│   ├── createAdminFirestore.ts # Admin user creation
│   └── migrate-to-firestore.ts # Data migration
├── types/                  # TypeScript interfaces
│   ├── index.ts           # Common types
│   └── firestore.ts       # Firestore-specific types
└── index.ts               # Server entry point
```

### Deployment Structure (`deploy/`)
```
deploy/
├── docker/                 # Docker configurations
│   └── Dockerfile.backend # Backend container definition
├── scripts/                # Deployment scripts
│   ├── deploy-backend.sh  # Backend deployment
│   └── deploy-frontend.sh # Frontend deployment
└── terraform/              # Infrastructure as code
    ├── main.tf            # Main Terraform config
    ├── variables.tf       # Variable definitions
    └── free-tier.tf       # GCP free tier setup
```

### Testing Structure (`tests/`)
```
tests/
├── auth.spec.ts           # Authentication tests
├── e2e-production.spec.ts # Production E2E tests
├── firestore-login.spec.ts # Firestore auth tests
└── navigation-firestore.spec.ts # Navigation tests
```

## Code Organization Patterns

### Component Organization
- **Atomic Design**: Components range from atoms to pages
- **Feature-based**: Components grouped by feature/functionality
- **Container/Presentational**: Separation of logic and UI
- **Context Providers**: Centralized state management

### Service Layer Pattern
- **API Services**: Dedicated service files for each resource type
- **Error Handling**: Centralized error management in services
- **Type Safety**: Full TypeScript coverage with generated types
- **Abstraction**: Services abstract API complexity from components

### Backend Architecture
- **MVC Pattern**: Models, Views (routes), Controllers
- **Middleware Pipeline**: Authentication, validation, caching
- **Database Abstraction**: Support for multiple database backends
- **Modular Design**: Clear separation of concerns

## File Naming Conventions

### TypeScript/JavaScript Files
- **Components**: PascalCase (e.g., `Dashboard.tsx`, `ClientModal.tsx`)
- **Services**: camelCase with suffix (e.g., `authService.ts`, `clientService.ts`)
- **Utilities**: camelCase (e.g., `typeAdapters.ts`, `formatDate.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `User.ts`, `Project.ts`)
- **Constants**: UPPER_SNAKE_CASE in files (e.g., `API_BASE_URL`)

### Configuration Files
- **Environment**: `.env` files for environment variables
- **JSON Config**: lowercase with hyphens (e.g., `firebase.json`, `tsconfig.json`)
- **Package Files**: Standard naming (`package.json`, `package-lock.json`)

### Documentation
- **Markdown**: UPPER_SNAKE_CASE for guides (e.g., `QUICK_START.md`)
- **Drafts**: Date prefix format `YYYYMMDD_HHMM_description.md`
- **API Specs**: lowercase with extension (e.g., `openapi.yaml`)

### Database Conventions
- **Firestore Suffix**: Files with `.firestore.ts` for Firestore-specific code
- **Legacy MongoDB**: Plain `.js` files for MongoDB implementations
- **Migration Scripts**: Descriptive names with action (e.g., `migrate-to-firestore.ts`)

## Import Organization

### Frontend Import Order
```typescript
// 1. External libraries
import React from 'react';
import { Box, Button } from '@chakra-ui/react';
import axios from 'axios';

// 2. Internal absolute imports
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

// 3. Relative imports
import ClientModal from './ClientModal';
import './styles.css';

// 4. Type imports
import type { User, Project } from '@/types';
```

### Backend Import Order
```typescript
// 1. Node.js built-ins
import path from 'path';
import { fileURLToPath } from 'url';

// 2. External packages
import express from 'express';
import { Firestore } from '@google-cloud/firestore';

// 3. Internal imports
import { authenticate } from '../middleware/auth.firestore';
import { User } from '../models/firestore/User';

// 4. Type imports
import type { Request, Response } from 'express';
```

## Key Architectural Principles

### Separation of Concerns
- **Clear Boundaries**: Frontend, backend, and database layers are independent
- **API Contract**: OpenAPI specification defines the contract
- **Single Responsibility**: Each module/component has one clear purpose

### Database Flexibility
- **Dual Support**: MongoDB and Firestore implementations coexist
- **Migration Path**: Clear migration scripts and procedures
- **Environment-based**: Database selection via environment variables

### Type Safety
- **End-to-end Types**: From database to UI with TypeScript
- **Generated Types**: API types auto-generated from OpenAPI spec
- **Strict Mode**: TypeScript strict mode enabled for safety

### Performance Optimization
- **Lazy Loading**: Components loaded on demand
- **Caching Strategy**: Server-side caching for expensive operations
- **Optimistic Updates**: UI updates before server confirmation

### Security First
- **JWT Authentication**: Stateless token-based auth
- **Role-based Access**: Admin, user, viewer roles
- **Input Validation**: Server-side validation on all inputs
- **Secure Storage**: Passwords hashed, sensitive data encrypted

### Development Experience
- **Hot Reload**: Fast refresh in development
- **Type Checking**: Real-time TypeScript validation
- **Linting**: Automated code quality checks
- **Testing**: Comprehensive test coverage

### Scalability Considerations
- **Stateless Backend**: Horizontal scaling capability
- **Database Indexes**: Optimized query performance
- **CDN Ready**: Static assets can be CDN-served
- **Container-based**: Docker deployment for consistency

## Module Boundaries

### Frontend Modules
- **Authentication**: Login, token management, protected routes
- **Time Management**: Time entries, timers, timesheets
- **Project Management**: Projects, tasks, assignments
- **Financial**: Expenses, invoices, billing
- **Reporting**: Analytics, dashboards, exports
- **Administration**: User management, settings

### Backend Modules
- **API Gateway**: Route handling, request validation
- **Business Logic**: Core application rules
- **Data Access**: Database operations, queries
- **Authentication**: Token validation, user sessions
- **Integration**: External service connections

### Shared Modules
- **Type Definitions**: Shared between frontend and backend
- **Validation Rules**: Common validation logic
- **Constants**: Shared configuration values
- **Utilities**: Common helper functions