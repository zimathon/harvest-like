import mongoose, { Schema } from 'mongoose';
import { InvoiceDocument } from '../types/index.js';

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    number: {
      type: String,
      required: true,
      unique: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft'
    },
    notes: {
      type: String
    },
    items: [
      {
        type: {
          type: String,
          enum: ['time', 'expense', 'item'],
          required: true
        },
        reference: {
          type: Schema.Types.ObjectId,
          refPath: 'items.type'
        },
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

// Virtual for total amount
InvoiceSchema.virtual('totalAmount').get(function(this: InvoiceDocument) {
  return this.amount + (this.tax || 0);
});

export default mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);