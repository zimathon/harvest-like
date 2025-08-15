import dotenv from 'dotenv';
import { initializeFirestore, getFirestore, collections } from '../src/config/firestore-local.js';
import User from '../src/models/firestore/User.js';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const deleteUser = async () => {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: npm run delete-user <email>');
      process.exit(1);
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // Delete user
    await User.delete(user.id!);
    
    console.log(`✅ Successfully deleted user: ${email}`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error deleting user:', error.message);
    process.exit(1);
  }
};

deleteUser();