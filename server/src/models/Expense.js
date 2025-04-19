import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Expense', ExpenseSchema);