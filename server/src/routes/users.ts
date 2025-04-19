import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(admin);

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

export default router;