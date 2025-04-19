import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clients.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/').get(getClients).post(createClient);
router.route('/:id').get(getClient).put(updateClient).delete(deleteClient);

export default router;