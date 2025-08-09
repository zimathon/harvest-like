# Development Commands

## Frontend Commands (run from root)
- `npm run dev` - Start frontend dev server (http://localhost:5173)
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint on frontend code
- `npm run preview` - Preview production build
- `npm run test:e2e` - Run Playwright E2E tests

## Backend Commands (run from server/)
- `npm run dev` - Start backend dev server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run create-admin --name <name> --email <email> --password <password>` - Create admin user
- `npm run create-admin:firestore` - Create admin user in Firestore emulator
- `npm run list-users` - List all users
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## Firestore Development
- `npm run dev:firestore` - Run full stack with Firestore emulator
- `npm run firestore:start` - Start Firestore emulator only
- `npm run migrate:firestore` - Migrate data to Firestore
- `npm run test:firestore` - Test Firestore integration
- `npm run test:firestore:features` - Test Firestore features

## Combined Commands (from root)
- `npm run dev:all` - Run frontend and backend concurrently
- `npm run stop:all` - Stop all running services

## Git Commands (Darwin/macOS)
- `git status` - Check repository status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote
- `git pull` - Pull from remote
- `git branch` - List branches
- `git checkout -b <branch>` - Create and switch to new branch

## Utility Commands
- `ls -la` - List files with details
- `cd <directory>` - Change directory
- `pwd` - Print working directory
- `find . -name "*.ts"` - Find TypeScript files
- `grep -r "pattern" .` - Search for pattern in files
- `lsof -ti:PORT | xargs kill -9` - Kill process on specific port