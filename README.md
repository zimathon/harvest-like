# Harvest-like Time Tracking Application

This repository contains a time tracking application with a React frontend and a Node.js/Express backend.

## 🌐 Production Environment

### Live URLs
- **Frontend Application**: https://harvest-a82c0.web.app
- **Backend API**: https://harvest-backend-sxoezkwvgq-an.a.run.app
  - API Base URL: `https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2`

### Login Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Management Consoles
- [Firebase Console](https://console.firebase.google.com/project/harvest-a82c0)
- [Cloud Run Console](https://console.cloud.google.com/run/detail/asia-northeast1/harvest-backend/metrics?project=harvest-a82c0)
- [Firestore Console](https://console.firebase.google.com/project/harvest-a82c0/firestore)

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn
* MongoDB (for backend data storage)

### Backend Setup

1. Navigate to the `server` directory:

    ```bash
    cd server
    ```

2. Install backend dependencies:

    ```bash
    npm install
    ```

3. Build the backend:

    ```bash
    npm run build
    ```

    This will compile TypeScript files into JavaScript in the `dist` directory.
4. Start the backend server:

    ```bash
    npm start
    ```

    The backend server will typically run on `http://localhost:5000` (or as configured in your environment variables).

### Frontend Setup

1. Navigate back to the project root directory:

    ```bash
    cd ..
    ```

2. Install frontend dependencies:

    ```bash
    npm install
    ```

3. Build the frontend:

    ```bash
    npm run build
    ```

    This will create a production-ready build of your React application in the `dist` directory.
4. Start the frontend development server:

    ```bash
    npm run dev
    ```

    The frontend development server will typically run on `http://localhost:5173` (or as configured by Vite).

## One-Command Local Startup (All Services)

You can start multiple services with a single command.

* macOS interactive script (recommended):

  ```bash
  ./scripts/quick-start-local.sh
  ```

  Menu options:
  * 1) Start MongoDB version (current)
  * 2) Start with Firestore emulator (testing)
  * 3) Start both (for migration testing)
  * 4) Stop all services
  * 5) Check service status
  * 6) Run Firestore tests only

* Using npm scripts:

  * Start frontend and backend together (ensure MongoDB is running separately):

    ```bash
    # Start MongoDB container (in another terminal)
    cd server && docker-compose up -d mongo && cd ..

    # Then, from project root
    npm run dev:all
    ```

  * Start Firestore emulator + backend + frontend together:

    ```bash
    npm run dev:firestore
    
    # With automatic error monitoring and fixing agent (recommended)
    npm run dev:monitored
    ```

  * Stop all related processes and free ports:

    ```bash
    npm run stop:all
    ```

  * Clear Firestore emulator data (when using dev:firestore):

    ```bash
    # From server directory
    cd server && npm run firestore:clear
    
    # Or from project root with confirmation prompt
    ./scripts/clear-firestore-data.sh
    ```

Service URLs:
* Frontend: <http://localhost:5173>
* Backend (MongoDB mode): <http://localhost:5001>
* Firestore Emulator UI (when using dev:firestore): <http://localhost:4000>

## Creating an Admin User

To create a new admin user, run the following command from the `server` directory:

```bash
npm run create-admin --name <your_name> --email <your_email> --password <your_password>
```

Replace `<your_name>`, `<your_email>`, and `<your_password>` with the desired credentials.

A default admin user has been created with the following credentials:
* **Email**: `admin2@example.com`
* **Password**: `password`

## Project Structure

* `server/`: Contains the Node.js/Express backend.
  * `src/`: Backend source code (TypeScript).
  * `dist/`: Compiled JavaScript files for the backend.
* `src/`: Contains the React frontend application.
  * `components/`: Reusable React components.
  * `pages/`: React components for different application pages.
  * `contexts/`: React Context API for state management.
  * `services/`: API service calls.
  * `types/`: TypeScript type definitions.
* `public/`: Static assets for the frontend.
* `index.html`: Main HTML file for the frontend.
* `package.json`: Project dependencies and scripts for the frontend.
* `server/package.json`: Project dependencies and scripts for the backend.
* `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration files.
* `vite.config.ts`: Vite configuration for the frontend.

## Contributing

(Optional: Add guidelines for contributing to the project)

## License

(Optional: Add license information)
