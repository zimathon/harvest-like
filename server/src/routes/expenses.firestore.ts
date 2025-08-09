import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from '../controllers/expenses.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Summary route must come before /:id route
router.route('/summary').get(getExpenseSummary);

// Me route - returns expenses for current user
router.route('/me').get(getExpenses);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

export default router;