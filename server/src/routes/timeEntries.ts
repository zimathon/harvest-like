import express from 'express';
import {
  getTimeEntries,
  getMyTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  startTimer,
  stopTimer
} from '../controllers/timeEntries.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/').get(getTimeEntries).post(createTimeEntry);
router.route('/me').get(getMyTimeEntries);
router.route('/timer/start').post(startTimer);
router.route('/timer/stop').put(stopTimer);
router.route('/:id').get(getTimeEntry).put(updateTimeEntry).delete(deleteTimeEntry);

export default router;