import mongoose, { Schema } from 'mongoose';
import { ExpenseDocument } from '../types/index.js';

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    category: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    receiptUrl: {
      type: String
    },
    notes: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ExpenseDocument>('Expense', ExpenseSchema);