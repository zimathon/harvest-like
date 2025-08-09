import dotenv from 'dotenv';
import { initializeFirestore } from '../config/firestore-local.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Initialize Firestore
initializeFirestore();

const API_BASE_URL = `http://localhost:${process.env.PORT || 5000}/api/v2`;
let authToken = '';
let testUserId = '';
let testClientId = '';
let testProjectId = '';
let testTimeEntryId = '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ ${name} passed`);
    testResults.push({ name, passed: true });
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    testResults.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Test Auth Features
async function testAuth() {
  // Register
  await runTest('Register new user', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    });
    
    if (!response.data.success || !response.data.token) {
      throw new Error('Registration failed');
    }
    
    authToken = response.data.token;
    testUserId = response.data.user.id;
  });

  // Login
  await runTest('Login with credentials', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: `test${Date.now() - 1000}@example.com`,
      password: 'password123'
    });
    
    if (!response.data.success || !response.data.token) {
      throw new Error('Login failed');
    }
  });

  // Get current user
  await runTest('Get current user', async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get current user');
    }
  });
}

// Test Client Features
async function testClients() {
  // Create client
  await runTest('Create client', async () => {
    const response = await axios.post(
      `${API_BASE_URL}/clients`,
      {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '123-456-7890',
        address: '123 Test St'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success || !response.data.data.id) {
      throw new Error('Failed to create client');
    }
    
    testClientId = response.data.data.id;
  });

  // Get all clients
  await runTest('Get all clients', async () => {
    const response = await axios.get(`${API_BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Failed to get clients');
    }
  });

  // Update client
  await runTest('Update client', async () => {
    const response = await axios.put(
      `${API_BASE_URL}/clients/${testClientId}`,
      { name: 'Updated Test Client' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to update client');
    }
  });
}

// Test Project Features
async function testProjects() {
  // Create project
  await runTest('Create project', async () => {
    const response = await axios.post(
      `${API_BASE_URL}/projects`,
      {
        name: 'Test Project',
        description: 'Test project description',
        client: testClientId,
        budget: 10000,
        budgetType: 'fixed',
        hourlyRate: 100,
        status: 'active',
        tasks: [
          { name: 'Development', hourlyRate: 100, isBillable: true },
          { name: 'Meeting', isBillable: false }
        ]
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success || !response.data.data.id) {
      throw new Error('Failed to create project');
    }
    
    testProjectId = response.data.data.id;
  });

  // Get all projects
  await runTest('Get all projects', async () => {
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Failed to get projects');
    }
  });

  // Get single project
  await runTest('Get single project', async () => {
    const response = await axios.get(`${API_BASE_URL}/projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get project');
    }
  });
}

// Test Time Entry Features
async function testTimeEntries() {
  // Create time entry
  await runTest('Create time entry', async () => {
    const response = await axios.post(
      `${API_BASE_URL}/time-entries`,
      {
        projectId: testProjectId,
        taskId: 'Development',
        date: new Date().toISOString().split('T')[0],
        duration: 3600, // 1 hour
        notes: 'Test time entry',
        isBillable: true
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success || !response.data.data.id) {
      throw new Error('Failed to create time entry');
    }
    
    testTimeEntryId = response.data.data.id;
  });

  // Get my time entries
  await runTest('Get my time entries', async () => {
    const response = await axios.get(`${API_BASE_URL}/time-entries/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new Error('Failed to get time entries');
    }
  });

  // Start timer
  await runTest('Start timer', async () => {
    const response = await axios.post(
      `${API_BASE_URL}/time-entries/timer/start`,
      {
        projectId: testProjectId,
        taskId: 'Development',
        notes: 'Timer test'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to start timer');
    }
  });

  // Stop timer
  await runTest('Stop timer', async () => {
    // Wait a bit to accumulate some time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.put(
      `${API_BASE_URL}/time-entries/timer/stop`,
      { notes: 'Timer stopped' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success || !response.data.data.duration) {
      throw new Error('Failed to stop timer');
    }
  });

  // Update time entry
  await runTest('Update time entry', async () => {
    const response = await axios.put(
      `${API_BASE_URL}/time-entries/${testTimeEntryId}`,
      { notes: 'Updated test time entry' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to update time entry');
    }
  });
}

// Cleanup test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete time entry
    if (testTimeEntryId) {
      await axios.delete(`${API_BASE_URL}/time-entries/${testTimeEntryId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    
    // Delete project
    if (testProjectId) {
      await axios.delete(`${API_BASE_URL}/projects/${testProjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    
    // Delete client
    if (testClientId) {
      await axios.delete(`${API_BASE_URL}/clients/${testClientId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Firestore feature tests...\n');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log('⚠️  Make sure the server is running with Firestore emulator!\n');
  
  try {
    await testAuth();
    await testClients();
    await testProjects();
    await testTimeEntries();
    await cleanup();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('===============');
    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    
    console.log(`Total tests: ${testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      testResults.filter(r => !r.passed).forEach(r => {
        console.log(`- ${r.name}: ${r.error}`);
      });
    }
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Check if server is running
axios.get(`${API_BASE_URL}/auth/login`)
  .catch(() => {
    console.error('❌ Server is not running! Please start the server first.');
    process.exit(1);
  })
  .then(() => runAllTests());