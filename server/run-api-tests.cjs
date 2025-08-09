const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api/v2';
let authToken;
let userId;
let clientId;
let projectId;
let timeEntryId;
let expenseId;
let invoiceId;

// Test user credentials
const testUser = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Helper function to make authenticated requests
const authRequest = async (method, url, data) => {
  return axios({
    method,
    url: `${API_BASE_URL}${url}`,
    data,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
};

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const logTest = (test, passed) => {
  const symbol = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${symbol} ${test}${colors.reset}`);
};

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  console.log('\n🧪 Running Firestore API v2 Tests...\n');

  try {
    // Auth Tests
    console.log(colors.yellow + '📋 Auth Endpoints' + colors.reset);
    
    // Login test
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
      if (response.status === 200 && response.data.success && response.data.token) {
        authToken = response.data.token;
        logTest('POST /auth/login - Login successful', true);
        passed++;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      logTest('POST /auth/login - Login failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
      return; // Can't continue without auth
    }

    // Get current user
    try {
      const response = await authRequest('GET', '/auth/me');
      if (response.status === 200 && response.data.data.email === testUser.email) {
        userId = response.data.data.id;
        logTest('GET /auth/me - Get current user', true);
        passed++;
      } else {
        throw new Error('Failed to get current user');
      }
    } catch (error) {
      logTest('GET /auth/me - Get current user failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Users Tests
    console.log('\n' + colors.yellow + '📋 Users Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('GET', '/users');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /users - List users', true);
        passed++;
      } else {
        throw new Error('Failed to list users');
      }
    } catch (error) {
      logTest('GET /users - List users failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Clients Tests
    console.log('\n' + colors.yellow + '📋 Clients Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('POST', '/clients', {
        name: 'Test Client',
        email: 'client@test.com',
        phone: '123-456-7890'
      });
      if (response.status === 201 && response.data.success) {
        clientId = response.data.data.id;
        logTest('POST /clients - Create client', true);
        passed++;
      } else {
        throw new Error('Failed to create client');
      }
    } catch (error) {
      logTest('POST /clients - Create client failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/clients');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /clients - List clients', true);
        passed++;
      } else {
        throw new Error('Failed to list clients');
      }
    } catch (error) {
      logTest('GET /clients - List clients failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Projects Tests
    console.log('\n' + colors.yellow + '📋 Projects Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('POST', '/projects', {
        name: 'Test Project',
        clientId: clientId,
        status: 'active',
        hourlyRate: 100
      });
      if (response.status === 201 && response.data.success) {
        projectId = response.data.data.id;
        logTest('POST /projects - Create project', true);
        passed++;
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      logTest('POST /projects - Create project failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/projects');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /projects - List projects', true);
        passed++;
      } else {
        throw new Error('Failed to list projects');
      }
    } catch (error) {
      logTest('GET /projects - List projects failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Time Entries Tests
    console.log('\n' + colors.yellow + '📋 Time Entries Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('POST', '/time-entries', {
        projectId: projectId,
        description: 'Test work',
        duration: 2,
        date: new Date().toISOString(),
        billable: true
      });
      if (response.status === 201 && response.data.success) {
        timeEntryId = response.data.data.id;
        logTest('POST /time-entries - Create time entry', true);
        passed++;
      } else {
        throw new Error('Failed to create time entry');
      }
    } catch (error) {
      logTest('POST /time-entries - Create time entry failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/time-entries/me');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /time-entries/me - List user time entries', true);
        passed++;
      } else {
        throw new Error('Failed to list time entries');
      }
    } catch (error) {
      logTest('GET /time-entries/me - List time entries failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Expenses Tests
    console.log('\n' + colors.yellow + '📋 Expenses Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('POST', '/expenses', {
        description: 'Test expense',
        amount: 100,
        category: 'office',
        date: new Date().toISOString(),
        projectId: projectId
      });
      if (response.status === 201 && response.data.success) {
        expenseId = response.data.data.id;
        logTest('POST /expenses - Create expense', true);
        passed++;
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      logTest('POST /expenses - Create expense failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/expenses');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /expenses - List expenses', true);
        passed++;
      } else {
        throw new Error('Failed to list expenses');
      }
    } catch (error) {
      logTest('GET /expenses - List expenses failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/expenses/summary');
      if (response.status === 200 && response.data.data.total !== undefined) {
        logTest('GET /expenses/summary - Get expense summary', true);
        passed++;
      } else {
        throw new Error('Failed to get expense summary');
      }
    } catch (error) {
      logTest('GET /expenses/summary - Get expense summary failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Invoices Tests
    console.log('\n' + colors.yellow + '📋 Invoices Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('POST', '/invoices', {
        clientId: clientId,
        items: [
          {
            description: 'Development work',
            quantity: 10,
            rate: 100
          }
        ],
        status: 'draft'
      });
      if (response.status === 201 && response.data.success) {
        invoiceId = response.data.data.id;
        logTest('POST /invoices - Create invoice', true);
        passed++;
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      logTest('POST /invoices - Create invoice failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/invoices');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /invoices - List invoices', true);
        passed++;
      } else {
        throw new Error('Failed to list invoices');
      }
    } catch (error) {
      logTest('GET /invoices - List invoices failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/invoices/summary');
      if (response.status === 200 && response.data.data) {
        logTest('GET /invoices/summary - Get invoice summary', true);
        passed++;
      } else {
        throw new Error('Failed to get invoice summary');
      }
    } catch (error) {
      logTest('GET /invoices/summary - Get invoice summary failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Reports Tests
    console.log('\n' + colors.yellow + '📋 Reports Endpoints' + colors.reset);
    
    try {
      const response = await authRequest('GET', '/reports/summary');
      if (response.status === 200 && response.data.data.totalHours !== undefined) {
        logTest('GET /reports/summary - Get summary report', true);
        passed++;
      } else {
        throw new Error('Failed to get summary report');
      }
    } catch (error) {
      logTest('GET /reports/summary - Get summary report failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/reports/time-entries');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /reports/time-entries - Get time entries report', true);
        passed++;
      } else {
        throw new Error('Failed to get time entries report');
      }
    } catch (error) {
      logTest('GET /reports/time-entries - Get time entries report failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/reports/expenses');
      if (response.status === 200 && response.data.data.total !== undefined) {
        logTest('GET /reports/expenses - Get expenses report', true);
        passed++;
      } else {
        throw new Error('Failed to get expenses report');
      }
    } catch (error) {
      logTest('GET /reports/expenses - Get expenses report failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/reports/projects');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /reports/projects - Get projects report', true);
        passed++;
      } else {
        throw new Error('Failed to get projects report');
      }
    } catch (error) {
      logTest('GET /reports/projects - Get projects report failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    try {
      const response = await authRequest('GET', '/reports/clients');
      if (response.status === 200 && Array.isArray(response.data.data)) {
        logTest('GET /reports/clients - Get clients report', true);
        passed++;
      } else {
        throw new Error('Failed to get clients report');
      }
    } catch (error) {
      logTest('GET /reports/clients - Get clients report failed', false);
      console.error('   ', error.response?.data || error.message);
      failed++;
    }

    // Cleanup
    console.log('\n' + colors.yellow + '🧹 Cleanup' + colors.reset);
    
    if (timeEntryId) {
      try {
        await authRequest('DELETE', `/time-entries/${timeEntryId}`);
        logTest('DELETE /time-entries/:id - Delete time entry', true);
        passed++;
      } catch (error) {
        logTest('DELETE /time-entries/:id - Delete time entry failed', false);
        failed++;
      }
    }

    if (expenseId) {
      try {
        await authRequest('DELETE', `/expenses/${expenseId}`);
        logTest('DELETE /expenses/:id - Delete expense', true);
        passed++;
      } catch (error) {
        logTest('DELETE /expenses/:id - Delete expense failed', false);
        failed++;
      }
    }

    if (invoiceId) {
      try {
        await authRequest('DELETE', `/invoices/${invoiceId}`);
        logTest('DELETE /invoices/:id - Delete invoice', true);
        passed++;
      } catch (error) {
        logTest('DELETE /invoices/:id - Delete invoice failed', false);
        failed++;
      }
    }

    if (projectId) {
      try {
        await authRequest('DELETE', `/projects/${projectId}`);
        logTest('DELETE /projects/:id - Delete project', true);
        passed++;
      } catch (error) {
        logTest('DELETE /projects/:id - Delete project failed', false);
        failed++;
      }
    }

    if (clientId) {
      try {
        await authRequest('DELETE', `/clients/${clientId}`);
        logTest('DELETE /clients/:id - Delete client', true);
        passed++;
      } catch (error) {
        logTest('DELETE /clients/:id - Delete client failed', false);
        failed++;
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`❌ Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log('='.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
};

// Run the tests
runTests();