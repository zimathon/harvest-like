import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/harvest-like');
    console.log('MongoDB connected');

    const users = await User.find({}).select('-password');
    
    console.log('\n=== ユーザー一覧 ===');
    console.log(`合計: ${users.length} ユーザー\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   作成日: ${user.createdAt}`);
      console.log('---');
    });

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

listUsers();