#!/usr/bin/env node

// Firestore Local Development with Concurrently
// This script starts all services using concurrently for better cross-platform compatibility

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Firestore Local Development Environment...\n');

// Check if concurrently is installed
try {
  require.resolve('concurrently');
} catch (e) {
  console.error('❌ concurrently is not installed. Please run: npm install --save-dev concurrently');
  process.exit(1);
}

// Build the concurrently command
const concurrentlyPath = path.join(__dirname, '..', 'node_modules', '.bin', 'concurrently');

const commands = [
  {
    command: 'cd server && npm run firestore:start',
    name: 'firestore',
    prefixColor: 'yellow'
  },
  {
    command: 'cd server && FIRESTORE_EMULATOR_HOST=localhost:8090 npm run dev',
    name: 'backend',
    prefixColor: 'blue'
  },
  {
    command: 'npm run dev',
    name: 'frontend',
    prefixColor: 'green'
  }
];

// Build concurrently arguments
const args = [
  '--prefix', 'name',
  '--prefix-colors', 'yellow,blue,green',
  '--kill-others-on-fail'
];

// Add commands
commands.forEach(cmd => {
  args.push(`"${cmd.command}"`);
});

console.log('📍 Service URLs:');
console.log('   - Frontend:        http://localhost:5173');
console.log('   - Backend API:     http://localhost:5001');
console.log('   - Firestore UI:    http://localhost:4000');
console.log('');
console.log('📝 API Endpoints:');
console.log('   - MongoDB (v1):    http://localhost:5001/api/*');
console.log('   - Firestore (v2):  http://localhost:5001/api/v2/*');
console.log('');
console.log('Press Ctrl+C to stop all services\n');

// Start concurrently
const proc = spawn(concurrentlyPath, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

proc.on('exit', (code) => {
  process.exit(code);
});