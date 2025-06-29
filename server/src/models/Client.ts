import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ClientDocument extends Document {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  user: Types.ObjectId; // Reference to the User who created this client
}

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
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ClientDocument>('Client', ClientSchema);