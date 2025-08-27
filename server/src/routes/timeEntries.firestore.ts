import express from 'express';
import {
  getTimeEntries,
  getMyTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  startTimer,
  stopTimer,
  resumeTimer
} from '../controllers/timeEntries.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getTimeEntries)
  .post(createTimeEntry);

router.get('/me', getMyTimeEntries);

// Timer routes
router.post('/timer/start', startTimer);
router.put('/timer/stop', stopTimer);

router
  .route('/:id')
  .get(getTimeEntry)
  .put(updateTimeEntry)
  .delete(deleteTimeEntry);

// Resume timer for existing entry
router.put('/:id/timer/resume', resumeTimer);

export default router;