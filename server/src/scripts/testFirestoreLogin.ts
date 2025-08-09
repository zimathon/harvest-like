import dotenv from 'dotenv';
import { initializeFirestore } from '../config/firestore-local.js';
import User from '../models/firestore/User.js';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const testLogin = async () => {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    
    console.log('Testing Firestore login...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ User not found in Firestore');
      
      // Create new admin user
      console.log('\n📝 Creating new admin user...');
      const newUser = await User.create({
        name: 'Admin User',
        email: email,
        password: password,
        role: 'admin' as const,
        isActive: true,
        avatar: ''
      });
      
      console.log('✅ Admin user created:', newUser.email);
      console.log('ID:', newUser.id);
      
      // Test login with new user
      const createdUser = await User.findByEmail(email);
      if (createdUser) {
        const isMatch = await User.comparePassword(createdUser, password);
        console.log('\n🔐 Password verification after creation:', isMatch ? '✅ Success' : '❌ Failed');
      }
    } else {
      console.log('✅ User found:', user.email);
      console.log('ID:', user.id);
      console.log('Role:', user.role);
      
      // Test password
      const isMatch = await User.comparePassword(user, password);
      console.log('\n🔐 Password verification:', isMatch ? '✅ Success' : '❌ Failed');
      
      if (!isMatch) {
        console.log('\n⚠️  Password mismatch. The user exists but the password is different.');
        console.log('You may need to delete the user and recreate it.');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();