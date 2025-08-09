#!/usr/bin/env node

/**
 * Start services with integrated log monitoring
 * This script starts the main services and the log monitor agent together
 */

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Parse command line arguments
const mode = process.argv[2] || 'firestore';
let mainCommand;
let serviceName;

switch (mode) {
  case 'firestore':
    mainCommand = 'npm run dev:firestore';
    serviceName = 'Firestore + Backend + Frontend';
    break;
  case 'all':
    mainCommand = 'npm run dev:all';
    serviceName = 'MongoDB Backend + Frontend';
    break;
  case 'backend':
    mainCommand = 'cd server && npm run dev';
    serviceName = 'Backend Only';
    break;
  case 'frontend':
    mainCommand = 'npm run dev';
    serviceName = 'Frontend Only';
    break;
  default:
    console.error(`${colors.red}Unknown mode: ${mode}${colors.reset}`);
    console.log(`Usage: node start-with-monitor.js [firestore|all|backend|frontend]`);
    process.exit(1);
}

console.log(`${colors.magenta}╔════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.magenta}║     🚀 Starting Services with Log Monitor Agent       ║${colors.reset}`);
console.log(`${colors.magenta}╚════════════════════════════════════════════════════════╝${colors.reset}`);
console.log(`${colors.cyan}Mode: ${serviceName}${colors.reset}`);
console.log(`${colors.cyan}Press Ctrl+C to stop all services${colors.reset}\n`);

// Start the main services
console.log(`${colors.blue}Starting main services...${colors.reset}`);
const mainProcess = spawn(mainCommand, {
  shell: true,
  stdio: 'pipe'
});

// Wait a bit for services to initialize
setTimeout(() => {
  console.log(`${colors.green}Starting log monitor agent...${colors.reset}`);
  
  // Start the log monitor agent
  const monitorProcess = spawn('node', [
    path.join(__dirname, 'log-monitor-agent.js'),
    mode
  ], {
    stdio: 'inherit'
  });
  
  // Handle monitor process errors
  monitorProcess.on('error', (error) => {
    console.error(`${colors.red}Monitor agent error: ${error.message}${colors.reset}`);
  });
  
  monitorProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.yellow}Monitor agent exited with code ${code}${colors.reset}`);
    }
  });
}, 3000);

// Pipe main process output
mainProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

mainProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle main process errors
mainProcess.on('error', (error) => {
  console.error(`${colors.red}Main process error: ${error.message}${colors.reset}`);
  process.exit(1);
});

mainProcess.on('exit', (code) => {
  console.log(`${colors.yellow}Main services exited with code ${code}${colors.reset}`);
  process.exit(code);
});

// Graceful shutdown
let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n${colors.yellow}Received ${signal}, shutting down gracefully...${colors.reset}`);
  
  // Kill all processes
  console.log(`${colors.blue}Stopping all services...${colors.reset}`);
  
  // Use the stop:all command to ensure clean shutdown
  const stopProcess = spawn('npm', ['run', 'stop:all'], {
    shell: true,
    stdio: 'inherit'
  });
  
  stopProcess.on('exit', () => {
    console.log(`${colors.green}All services stopped successfully${colors.reset}`);
    process.exit(0);
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log(`${colors.red}Force stopping...${colors.reset}`);
    process.exit(1);
  }, 5000);
}

// Handle various shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught exception: ${error.message}${colors.reset}`);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled rejection at:${colors.reset}`, promise, `${colors.red}reason:${colors.reset}`, reason);
  shutdown('unhandledRejection');
});