import dotenv from 'dotenv';
import { getFirestore } from '../config/firestore-local.js';

dotenv.config();

// Initialize Firestore with local config
const db = getFirestore();

const resetUsers = async () => {
  try {
    console.log('🗑️  Deleting all existing users from Firestore...');
    
    // Get all users
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    // Delete each user
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${snapshot.size} users`);
    
    // Create new admin user using direct Firestore operations
    console.log('\n📝 Creating new admin user directly in Firestore...');
    
    // Hash the password using bcrypt
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default;
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await usersRef.add(adminData);
    console.log('✅ Admin user created with ID:', docRef.id);
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    
    // Verify the user was created
    const verifyDoc = await docRef.get();
    if (verifyDoc.exists) {
      console.log('\n✅ User verified in Firestore');
      const userData = verifyDoc.data();
      console.log('User data:', {
        id: docRef.id,
        email: userData?.email,
        name: userData?.name,
        role: userData?.role,
        hasPassword: !!userData?.password
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetUsers();