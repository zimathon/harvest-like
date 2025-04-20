import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('MONGO_URI not defined in environment variables');
      process.exit(1);
    }
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};

// 切断関数を追加・エクスポート
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error instanceof Error ? error.message : error}`);
    // ここではプロセスを終了させない方が良い場合もある
  }
};