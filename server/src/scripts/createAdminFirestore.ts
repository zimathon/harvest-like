import dotenv from 'dotenv';
import { initializeFirestore } from '../config/firestore-local.js';
import User from '../models/firestore/User.js';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const createAdmin = async () => {
  try {
    // 管理者情報を設定
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // パスワードは自動的にハッシュ化されます
      role: 'admin' as const,
      isActive: true,
      avatar: ''
    };

    console.log('Creating admin user in Firestore...');
    
    // 既存のユーザーをチェック
    const existingUser = await User.findByEmail(adminData.email);
    if (existingUser) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      process.exit(0);
    }

    // 新規管理者を作成
    const newAdmin = await User.create(adminData);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', newAdmin.email);
    console.log('Password: admin123');
    console.log('Role:', newAdmin.role);
    console.log('ID:', newAdmin.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();