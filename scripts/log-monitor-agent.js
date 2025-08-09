#!/usr/bin/env node

/**
 * Server Log Monitoring and Auto-Fix Agent
 * 
 * This agent monitors server logs in real-time and attempts to automatically
 * fix common issues based on predefined patterns and rules.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Error patterns and their auto-fix strategies
const ERROR_PATTERNS = [
  {
    pattern: /ECONNREFUSED.*:27017/i,
    type: 'MongoDB Connection Error',
    severity: 'high',
    autoFix: async () => {
      console.log(`${colors.yellow}🔧 Attempting to start MongoDB container...${colors.reset}`);
      return executeCommand('cd server && docker-compose up -d mongo');
    },
    description: 'MongoDB connection refused - starting MongoDB container'
  },
  {
    pattern: /EADDRINUSE.*:(\d+)/i,
    type: 'Port Already in Use',
    severity: 'high',
    autoFix: async (match) => {
      const port = match[1];
      console.log(`${colors.yellow}🔧 Port ${port} is in use. Attempting to free it...${colors.reset}`);
      return executeCommand(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    },
    description: 'Port conflict - attempting to free the port'
  },
  {
    pattern: /Cannot find module\s+['"](.+?)['"]/i,
    type: 'Missing Module',
    severity: 'medium',
    autoFix: async (match) => {
      const moduleName = match[1];
      console.log(`${colors.yellow}🔧 Installing missing module: ${moduleName}${colors.reset}`);
      
      // Determine if it's a server or frontend module based on the path
      const isServerModule = match.input.includes('server/');
      const command = isServerModule 
        ? `cd server && npm install ${moduleName}`
        : `npm install ${moduleName}`;
      
      return executeCommand(command);
    },
    description: 'Missing npm module - attempting to install'
  },
  {
    pattern: /TypeError:.*undefined/i,
    type: 'Type Error',
    severity: 'medium',
    autoFix: null, // Cannot auto-fix, just log for manual intervention
    description: 'Type error detected - manual intervention required'
  },
  {
    pattern: /UnhandledPromiseRejectionWarning/i,
    type: 'Unhandled Promise Rejection',
    severity: 'medium',
    autoFix: null,
    description: 'Unhandled promise rejection - review async error handling'
  },
  {
    pattern: /CORS.*blocked/i,
    type: 'CORS Error',
    severity: 'medium',
    autoFix: async () => {
      console.log(`${colors.yellow}🔧 CORS issue detected. Checking CORS configuration...${colors.reset}`);
      // Log the current CORS settings for review
      const envPath = path.join(process.cwd(), 'server', '.env');
      try {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const corsOrigin = envContent.match(/CORS_ALLOWED_ORIGINS=(.+)/);
        if (corsOrigin) {
          console.log(`Current CORS settings: ${corsOrigin[1]}`);
        }
      } catch (err) {
        console.log('Could not read .env file');
      }
      return { success: false, message: 'Please verify CORS_ALLOWED_ORIGINS in server/.env' };
    },
    description: 'CORS configuration issue'
  },
  {
    pattern: /Failed to compile/i,
    type: 'Compilation Error',
    severity: 'high',
    autoFix: null,
    description: 'Compilation error - check syntax and imports'
  },
  {
    pattern: /MongoNetworkError/i,
    type: 'MongoDB Network Error',
    severity: 'high',
    autoFix: async () => {
      console.log(`${colors.yellow}🔧 MongoDB network error. Restarting MongoDB...${colors.reset}`);
      await executeCommand('cd server && docker-compose restart mongo');
      return { success: true, message: 'MongoDB restarted' };
    },
    description: 'MongoDB network issue - restarting service'
  }
];

// Statistics tracking
const stats = {
  errorsDetected: 0,
  errorsFixed: 0,
  errorsFailed: 0,
  startTime: Date.now(),
  errorLog: []
};

// Execute shell command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: errorOutput || output });
      }
    });
  });
}

// Analyze log line for errors
async function analyzeLogLine(line) {
  for (const errorPattern of ERROR_PATTERNS) {
    const match = line.match(errorPattern.pattern);
    if (match) {
      stats.errorsDetected++;
      
      const error = {
        timestamp: new Date().toISOString(),
        type: errorPattern.type,
        severity: errorPattern.severity,
        line: line.substring(0, 200), // Truncate long lines
        description: errorPattern.description
      };
      
      stats.errorLog.push(error);
      
      console.log(`\n${colors.red}❗ Error Detected: ${errorPattern.type}${colors.reset}`);
      console.log(`${colors.cyan}   Severity: ${errorPattern.severity}${colors.reset}`);
      console.log(`${colors.cyan}   Description: ${errorPattern.description}${colors.reset}`);
      
      if (errorPattern.autoFix) {
        console.log(`${colors.green}🔧 Attempting auto-fix...${colors.reset}`);
        try {
          const result = await errorPattern.autoFix(match);
          if (result && result.success !== false) {
            console.log(`${colors.green}✅ Auto-fix successful!${colors.reset}`);
            stats.errorsFixed++;
            error.fixed = true;
          } else {
            console.log(`${colors.yellow}⚠️  Auto-fix failed: ${result?.message || 'Unknown error'}${colors.reset}`);
            stats.errorsFailed++;
            error.fixed = false;
          }
        } catch (err) {
          console.log(`${colors.red}❌ Auto-fix error: ${err.message}${colors.reset}`);
          stats.errorsFailed++;
          error.fixed = false;
        }
      } else {
        console.log(`${colors.yellow}⚠️  No auto-fix available - manual intervention required${colors.reset}`);
      }
      
      return error;
    }
  }
  return null;
}

// Monitor logs from a process
function monitorProcess(command, label) {
  console.log(`${colors.blue}🔍 Starting log monitor for: ${label}${colors.reset}`);
  
  const child = spawn(command, { shell: true });
  
  child.stdout.on('data', async (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        await analyzeLogLine(line);
      }
    }
  });
  
  child.stderr.on('data', async (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        await analyzeLogLine(line);
      }
    }
  });
  
  child.on('close', (code) => {
    console.log(`${colors.yellow}Process ${label} exited with code ${code}${colors.reset}`);
  });
  
  return child;
}

// Print statistics
function printStats() {
  const runtime = Math.floor((Date.now() - stats.startTime) / 1000);
  console.log(`\n${colors.magenta}📊 === Log Monitor Statistics ===${colors.reset}`);
  console.log(`Runtime: ${runtime} seconds`);
  console.log(`Errors Detected: ${stats.errorsDetected}`);
  console.log(`Errors Fixed: ${stats.errorsFixed}`);
  console.log(`Errors Failed: ${stats.errorsFailed}`);
  console.log(`Success Rate: ${stats.errorsDetected > 0 ? Math.round((stats.errorsFixed / stats.errorsDetected) * 100) : 0}%`);
  
  if (stats.errorLog.length > 0) {
    console.log(`\n${colors.cyan}Recent Errors:${colors.reset}`);
    stats.errorLog.slice(-5).forEach(error => {
      console.log(`  [${error.timestamp}] ${error.type} - ${error.fixed ? '✅ Fixed' : '❌ Not Fixed'}`);
    });
  }
}

// Save error log to file
async function saveErrorLog() {
  const logDir = path.join(process.cwd(), 'logs');
  await fs.mkdir(logDir, { recursive: true });
  
  const logFile = path.join(logDir, `monitor-${new Date().toISOString().split('T')[0]}.json`);
  await fs.writeFile(logFile, JSON.stringify(stats, null, 2));
  console.log(`${colors.green}📝 Error log saved to: ${logFile}${colors.reset}`);
}

// Main function
async function main() {
  console.log(`${colors.magenta}🤖 === Server Log Monitor Agent ===${colors.reset}`);
  console.log(`${colors.cyan}Monitoring server logs for errors and attempting auto-fixes...${colors.reset}`);
  console.log(`${colors.cyan}Press Ctrl+C to stop${colors.reset}\n`);
  
  // Determine which process to monitor based on command line arguments
  const target = process.argv[2] || 'dev:firestore';
  
  let command;
  switch (target) {
    case 'backend':
      command = 'cd server && npm run dev';
      break;
    case 'frontend':
      command = 'npm run dev';
      break;
    case 'dev:all':
      command = 'npm run dev:all';
      break;
    case 'dev:firestore':
    default:
      command = 'npm run dev:firestore';
      break;
  }
  
  // Start monitoring
  const monitoredProcess = monitorProcess(command, target);
  
  // Set up graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down log monitor...');
    printStats();
    await saveErrorLog();
    
    // Kill the monitored process
    monitoredProcess.kill('SIGINT');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });
  
  // Print stats every 30 seconds
  setInterval(printStats, 30000);
}

// Run the agent
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeLogLine, ERROR_PATTERNS };