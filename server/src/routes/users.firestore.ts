import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} from '../controllers/users.firestore.js';
import { protect, authorize } from '../middleware/auth.firestore.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router
  .route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), createUser);

router
  .route('/:id')
  .get(authorize('admin'), getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

// Password update - admin or own account
router.put('/:id/password', updatePassword);

export default router;