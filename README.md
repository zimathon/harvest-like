# Harvest-like Time Tracking Application

This repository contains a time tracking application with a React frontend and a Node.js/Express backend.

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
