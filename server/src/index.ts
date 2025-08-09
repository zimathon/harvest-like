import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import expenseRoutes from './routes/expenses.js';
import projectRoutes from './routes/projects.js';
import timeEntryRoutes from './routes/timeEntries.js';
import userRoutes from './routes/users.js';
import invoiceRoutes from './routes/invoices.js';

// Import Firestore routes
import authRoutesFirestore from './routes/auth.firestore.js';
import usersRoutesFirestore from './routes/users.firestore.js';
import projectsRoutesFirestore from './routes/projects.firestore.js';
import timeEntriesRoutesFirestore from './routes/timeEntries.firestore.js';
import clientsRoutesFirestore from './routes/clients.firestore.js';
import expensesRoutesFirestore from './routes/expenses.firestore.js';
import invoicesRoutesFirestore from './routes/invoices.firestore.js';
import reportsRoutesFirestore from './routes/reports.firestore.js';

// Initialize Firestore (for local development)
import { initializeFirestore } from './config/firestore-local.js';
if (process.env.NODE_ENV === 'development') {
  initializeFirestore();
}

// Load environment variables (dotenv.config() は一度だけ呼び出す)
dotenv.config(); // .env ファイルを読み込む

// Connect to Database
connectDB();

const app = express();

// --- CORS設定 ---
// .env から許可するオリジンを取得 (カンマ区切りを想定)
const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(',').map(origin => origin.trim()) : [];

// CORS オプションを設定
const options: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allowedOrigins に含まれているか、オリジンがない場合 (例: Postmanなどのツール) は許可
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin '${origin}' not allowed.`); // ログに記録
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cookie や Authorization ヘッダーを扱うために true に設定
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // 必要に応じて調整
  allowedHeaders: ['Content-Type', 'Authorization'], // 必要に応じて調整
};

app.use(cors(options)); // 設定を適用
// --- CORS設定ここまで ---

// Middleware
app.use(express.json());
// app.use(cors()); // <<< 元の cors() 呼び出しは削除
app.use(morgan('dev'));

// Routes - MongoDB (v1)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);

// Routes - Firestore (v2)
app.use('/api/v2/auth', authRoutesFirestore);
app.use('/api/v2/users', usersRoutesFirestore);
app.use('/api/v2/projects', projectsRoutesFirestore);
app.use('/api/v2/time-entries', timeEntriesRoutesFirestore);
app.use('/api/v2/clients', clientsRoutesFirestore);
app.use('/api/v2/expenses', expensesRoutesFirestore);
app.use('/api/v2/invoices', invoicesRoutesFirestore);
app.use('/api/v2/reports', reportsRoutesFirestore);

// Error handler
interface AppError extends Error {
  stack?: string;
  message: string;
  status?: number;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error Handler:', err); // エラー内容をログ出力
  // CORSエラーの場合は専用のメッセージを返すことも検討
  if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ success: false, error: 'Not allowed by CORS' });
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000; // .env で PORT=5001 に設定済み

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`); // 起動時に許可オリジンをログ出力
});