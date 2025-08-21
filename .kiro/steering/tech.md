# Technology Stack: Harvest-like Time Tracking Application

**Last Updated**: 2025-01-17  
**Inclusion Mode**: Always Included

## Architecture

### System Architecture
- **Type**: Full-stack web application with REST API
- **Pattern**: Client-Server architecture with API-first design
- **Deployment**: Cloud-native with containerization support
- **Database Strategy**: Dual support for MongoDB and Firestore
- **Authentication**: JWT-based token authentication
- **State Management**: React Context API with reducers

### Infrastructure Architecture
- **Production**: Google Cloud Platform (GCP)
  - Frontend: Firebase Hosting
  - Backend: Cloud Run (containerized)
  - Database: Firestore (NoSQL)
  - Storage: Firebase Storage (for future file uploads)
- **Local Development**: Docker containers and emulators
- **CI/CD**: GitHub Actions for automated deployment

## Frontend

### Core Framework
- **React 18.2.0**: Component-based UI framework
- **TypeScript 5.2.2**: Type-safe JavaScript development
- **Vite 5.0.8**: Fast build tool and dev server

### UI & Styling
- **Chakra UI 2.8.2**: Component library with built-in theming
- **Emotion 11.11**: CSS-in-JS styling solution
- **Framer Motion 10.16**: Animation library for smooth transitions
- **React Icons 5.5.0**: Comprehensive icon library

### Routing & State
- **React Router DOM 6.21.1**: Client-side routing
- **React Context API**: Global state management
- **Custom Hooks**: Reusable logic patterns

### Data Fetching
- **Axios 1.8.4**: HTTP client for API communication
- **OpenAPI TypeScript 7.8.0**: Auto-generated API types from OpenAPI spec

### Build & Development
- **ESLint 8.55.0**: Code linting and quality checks
- **TypeScript ESLint**: TypeScript-specific linting rules
- **Playwright 1.53.1**: E2E testing framework
- **Concurrently 9.2.0**: Run multiple dev processes

## Backend

### Core Framework
- **Node.js**: JavaScript runtime (ES modules enabled)
- **Express 4.18.2**: Web application framework
- **TypeScript 5.3.3**: Type-safe backend development

### Database & ORM
- **Google Cloud Firestore 7.11.2**: NoSQL document database (production)
- **Firebase Admin SDK 13.4.0**: Server-side Firebase operations
- **MongoDB** (optional): Alternative database for local development
- **Node Cache 5.1.2**: In-memory caching for performance

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)**: Token-based authentication
- **bcryptjs 2.4.3**: Password hashing
- **CORS 2.8.5**: Cross-origin resource sharing
- **Express Validator 7.0.1**: Input validation and sanitization

### Utilities
- **Morgan 1.10.0**: HTTP request logging
- **Dotenv 16.3.1**: Environment variable management
- **Nodemailer 7.0.5**: Email sending capabilities
- **Commander 14.0.0**: CLI argument parsing

### Development Tools
- **TSX**: TypeScript execution and hot reload
- **Jest 30.0.5**: Unit testing framework
- **TS-Jest 29.4.0**: TypeScript support for Jest
- **Nodemon 3.0.2**: Auto-restart on file changes

## Development Environment

### Required Tools
- **Node.js**: LTS version (18.x or higher recommended)
- **npm**: Package manager (comes with Node.js)
- **Git**: Version control
- **Docker** (optional): For containerized development
- **gcloud CLI** (optional): For GCP deployment

### IDE Setup
- **VS Code** (recommended): With TypeScript and ESLint extensions
- **Prettier**: Code formatting (optional but recommended)
- **GitLens**: Enhanced Git integration (optional)

### Local Services
- **Firestore Emulator**: Local Firestore instance for development
- **MongoDB Docker Container**: Alternative local database
- **Firebase Auth Emulator**: Local authentication testing

## Common Commands

### Frontend Commands
```bash
npm run dev                # Start frontend dev server (port 5173)
npm run build              # Build production frontend
npm run lint               # Run ESLint checks
npm run test:e2e           # Run Playwright E2E tests
npm run generate:types     # Generate TypeScript types from OpenAPI
```

### Backend Commands
```bash
cd server
npm run dev                # Start backend dev server (port 5001)
npm run build              # Compile TypeScript to JavaScript
npm run start              # Start production server
npm run create-admin       # Create admin user via CLI
npm run test               # Run Jest unit tests
```

### Full Stack Commands
```bash
npm run dev:all            # Start frontend + backend (MongoDB)
npm run dev:firestore      # Start with production Firestore
npm run dev:monitored      # Start with error monitoring
npm run stop:all           # Stop all services and free ports
./scripts/quick-start-local.sh  # Interactive startup menu
```

### Database Commands
```bash
# Firestore commands (from server directory)
npm run firestore:start    # Start Firestore emulator
npm run firestore:clear    # Clear emulator data
npm run migrate:firestore  # Migrate data to Firestore

# User management
npm run create-admin:firestore  # Create admin in Firestore
npm run list-users         # List all users
npm run update-user        # Update user details
```

## Environment Variables

### Frontend Environment (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5001/api/v2  # Local backend
# VITE_API_URL=https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2  # Production
```

### Backend Environment (server/.env)
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
PROJECT_ID=harvest-a82c0
GOOGLE_CLOUD_PROJECT=harvest-a82c0
USE_FIRESTORE_EMULATOR=false

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Firestore Emulator (optional)
FIRESTORE_EMULATOR_HOST=localhost:8090

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Port Configuration

### Development Ports
- **5173**: Frontend dev server (Vite)
- **5001**: Backend API server
- **8090**: Firestore emulator
- **4000**: Firestore emulator UI
- **27017**: MongoDB (if using Docker)

### Production URLs
- **Frontend**: https://harvest-a82c0.web.app
- **Backend API**: https://harvest-backend-sxoezkwvgq-an.a.run.app
- **API Base**: https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2

## API Design

### REST API Structure
- **Base Path**: `/api/v2`
- **Authentication**: Bearer token in Authorization header
- **Content Type**: application/json
- **OpenAPI Spec**: `api/openapi.yaml`

### Core Endpoints
- `/auth/*`: Authentication (login, register, refresh)
- `/users/*`: User management
- `/clients/*`: Client CRUD operations
- `/projects/*`: Project management
- `/time-entries/*`: Time tracking
- `/expenses/*`: Expense tracking
- `/invoices/*`: Invoice generation
- `/reports/*`: Analytics and reporting

## Deployment Configuration

### Firebase Configuration
- **Project ID**: harvest-a82c0
- **Hosting**: Static site deployment
- **Firestore**: Production database
- **Authentication**: User management

### Cloud Run Configuration
- **Region**: asia-northeast1
- **Memory**: 512MB (can be adjusted)
- **CPU**: 1 vCPU
- **Concurrency**: 1000 requests
- **Min Instances**: 0 (scale to zero)
- **Max Instances**: 100 (auto-scaling)

### Docker Configuration
- **Backend Image**: Node.js Alpine base
- **Multi-stage Build**: Separate build and runtime stages
- **Health Check**: /health endpoint
- **Port**: 8080 (Cloud Run standard)