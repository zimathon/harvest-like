import mongoose, { Schema } from 'mongoose';
import { ProjectDocument } from '../types/index.js';

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
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ProjectDocument>('Project', ProjectSchema);