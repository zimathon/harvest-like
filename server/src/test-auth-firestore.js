import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5001/api/v2';

async function testAuthFirestore() {
  console.log('🧪 Testing Firestore Auth API...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerData.error}`);
    }

    const token = registerData.token;
    console.log('✅ User registered successfully\n');

    // Test 2: Login with the created user
    console.log('2️⃣ Testing user login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    console.log('✅ User logged in successfully\n');

    // Test 3: Get current user
    console.log('3️⃣ Testing get current user...');
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const meData = await meResponse.json();
    console.log('Current user:', meData);

    if (!meResponse.ok) {
      throw new Error(`Get current user failed: ${meData.error}`);
    }

    console.log('✅ Current user retrieved successfully\n');

    // Test 4: Try to register with same email (should fail)
    console.log('4️⃣ Testing duplicate registration...');
    const duplicateResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: 'testuser@example.com',
        password: 'password456'
      })
    });

    const duplicateData = await duplicateResponse.json();
    
    if (duplicateResponse.ok) {
      throw new Error('Duplicate registration should have failed');
    }

    console.log('✅ Duplicate registration prevented:', duplicateData.error, '\n');

    // Test 5: Test invalid login
    console.log('5️⃣ Testing invalid login...');
    const invalidLoginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      })
    });

    const invalidLoginData = await invalidLoginResponse.json();
    
    if (invalidLoginResponse.ok) {
      throw new Error('Invalid login should have failed');
    }

    console.log('✅ Invalid login rejected:', invalidLoginData.error, '\n');

    console.log('🎉 All auth tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAuthFirestore();