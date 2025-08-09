import express from 'express';
import {
  getSummaryReport,
  getTimeEntriesReport,
  getExpensesReport,
  getProjectsReport,
  getClientsReport
} from '../controllers/reports.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/summary').get(getSummaryReport);
router.route('/time-entries').get(getTimeEntriesReport);
router.route('/expenses').get(getExpensesReport);
router.route('/projects').get(getProjectsReport);
router.route('/clients').get(getClientsReport);

export default router;