import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const deleteAllUsers = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');
    
    const result = await User.deleteMany({});
    console.log(`\n✅ 削除完了: ${result.deletedCount} ユーザーを削除しました`);
    
    await disconnectDB();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteAllUsers();