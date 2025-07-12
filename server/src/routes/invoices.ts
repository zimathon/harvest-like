import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoices.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.route('/').get(protect, getInvoices).post(protect, createInvoice);
router.route('/:id').get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);

export default router;