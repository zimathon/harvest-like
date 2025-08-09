import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clients.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getClients)
  .post(createClient);

router
  .route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

export default router;