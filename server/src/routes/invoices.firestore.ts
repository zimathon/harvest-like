import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoiceAsPaid,
  getInvoiceSummary
} from '../controllers/invoices.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Summary route must come before /:id route
router.route('/summary').get(getInvoiceSummary);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.route('/:id/pay').put(markInvoiceAsPaid);

export default router;