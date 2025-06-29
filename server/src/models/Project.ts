import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ProjectDocument extends Document {
  name: string;
  client: Types.ObjectId;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on hold';
  budget?: number;
  budgetType: 'hourly' | 'fixed';
  hourlyRate?: number;
  members: Array<{ user: Types.ObjectId; role: string }>;
  tasks: Array<{ name: string; hourlyRate?: number; isBillable: boolean }>;
  user: Types.ObjectId; // Reference to the User who created this project
}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'on hold'],
      default: 'active'
    },
    budget: {
      type: Number,
      default: 0
    },
    budgetType: {
      type: String,
      enum: ['hourly', 'fixed'],
      default: 'hourly'
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          default: 'member'
        }
      }
    ],
    tasks: [
      {
        name: String,
        hourlyRate: Number,
        isBillable: {
          type: Boolean,
          default: true
        }
      }
    ],
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

export default mongoose.model<ProjectDocument>('Project', ProjectSchema);