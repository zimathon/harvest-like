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

// Routes with different permission levels
router
  .route('/')
  .get(getUsers)  // Any authenticated user can view users
  .post(authorize('admin'), createUser);  // Only admins can create users

router
  .route('/:id')
  .get(getUser)  // Any authenticated user can view a specific user
  .put(authorize('admin'), updateUser)  // Only admins can update users
  .delete(authorize('admin'), deleteUser);  // Only admins can delete users

// Password update - admin or own account
router.put('/:id/password', updatePassword);

export default router;