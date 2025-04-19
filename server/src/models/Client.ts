import mongoose, { Schema } from 'mongoose';
import { ClientDocument } from '../types/index.js';

const ClientSchema = new Schema<ClientDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please add a client name'],
      trim: true
    },
    contactName: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ClientDocument>('Client', ClientSchema);