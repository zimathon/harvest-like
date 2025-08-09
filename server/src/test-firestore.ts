import { initializeFirestore } from './config/firestore-local.js';
import { User } from './models/firestore/User.js';
import { Client } from './models/firestore/Client.js';
import { Project } from './models/firestore/Project.js';
import { TimeEntry } from './models/firestore/TimeEntry.js';

async function testFirestore() {
  console.log('🧪 Testing Firestore connection...');
  
  try {
    // Initialize Firestore
    initializeFirestore();
    console.log('✅ Firestore initialized');

    // Test User creation
    console.log('\n📝 Testing User model...');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true
    });
    console.log('✅ User created:', testUser.id);

    // Test finding user by email
    const foundUser = await User.findByEmail('test@example.com');
    console.log('✅ User found by email:', foundUser?.id);

    // Test Client creation
    console.log('\n📝 Testing Client model...');
    const testClient = await Client.create({
      name: 'Test Client',
      email: 'client@example.com',
      userId: testUser.id!
    });
    console.log('✅ Client created:', testClient.id);

    // Test Project creation
    console.log('\n📝 Testing Project model...');
    const testProject = await Project.create({
      name: 'Test Project',
      clientId: testClient.id!,
      userId: testUser.id!,
      status: 'active',
      members: [],
      tasks: [
        { id: 'task1', name: 'Development', isBillable: true },
        { id: 'task2', name: 'Meeting', isBillable: false }
      ]
    });
    console.log('✅ Project created:', testProject.id);

    // Test TimeEntry creation
    console.log('\n📝 Testing TimeEntry model...');
    const testEntry = await TimeEntry.create({
      userId: testUser.id!,
      projectId: testProject.id!,
      taskId: 'task1',
      date: new Date().toISOString().split('T')[0],
      duration: 3600, // 1 hour in seconds
      notes: 'Test time entry',
      isBillable: true,
      isRunning: false
    });
    console.log('✅ TimeEntry created:', testEntry.id);

    // Test population
    console.log('\n📝 Testing data population...');
    const populatedEntry = await TimeEntry.findById(testEntry.id!, ['project', 'user']);
    console.log('✅ TimeEntry with populated data:', {
      id: populatedEntry?.id,
      project: populatedEntry?.project?.name,
      user: populatedEntry?.user?.name,
      task: populatedEntry?.task
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await TimeEntry.delete(testEntry.id!);
    await Project.delete(testProject.id!);
    await Client.delete(testClient.id!);
    await User.delete(testUser.id!);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFirestore();