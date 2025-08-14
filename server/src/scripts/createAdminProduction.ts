import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcryptjs from 'bcryptjs';

dotenv.config();

// 本番環境のFirestoreを初期化
const app = initializeApp({
  projectId: 'harvest-a82c0'
});

const db = getFirestore(app);

const createProductionAdmin = async () => {
  try {
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🔍 Checking for existing admin user in production...');
    
    // 既存のユーザーをチェック
    const usersRef = db.collection('users');
    const existingUserQuery = await usersRef.where('email', '==', adminData.email).get();
    
    if (!existingUserQuery.empty) {
      console.log('❌ Admin user already exists in production!');
      const existingUser = existingUserQuery.docs[0].data();
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      process.exit(0);
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcryptjs.hash(adminData.password, 10);
    
    // 新規管理者を作成
    const userDoc = {
      ...adminData,
      password: hashedPassword
    };
    
    const docRef = await usersRef.add(userDoc);
    
    console.log('✅ Admin user created successfully in production!');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', adminData.role);
    console.log('ID:', docRef.id);
    console.log('');
    console.log('🌐 You can now login at: https://harvest-a82c0.web.app');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createProductionAdmin();