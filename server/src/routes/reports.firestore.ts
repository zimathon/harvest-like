import express from 'express';
import {
  getSummaryReport,
  getTimeEntriesReport,
  getWeeklyTimeReport,
  getMonthlyTimeReport,
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
router.route('/time-entries/weekly').get(getWeeklyTimeReport);
router.route('/time-entries/monthly').get(getMonthlyTimeReport);
router.route('/expenses').get(getExpensesReport);
router.route('/projects').get(getProjectsReport);
router.route('/clients').get(getClientsReport);

export default router;