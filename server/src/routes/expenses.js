import express from 'express';
import {
  getExpenses,
  getMyExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  updateExpenseStatus
} from '../controllers/expenses.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/').get(getExpenses).post(createExpense);
router.route('/me').get(getMyExpenses);
router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);
router.route('/:id/status').put(admin, updateExpenseStatus);

export default router;