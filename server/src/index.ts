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

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clients', clientRoutes);

// Error handler
interface AppError extends Error {
  stack?: string;
  message: string;
  status?: number;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});