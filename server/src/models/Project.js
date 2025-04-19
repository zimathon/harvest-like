import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
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
          type: mongoose.Schema.Types.ObjectId,
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

export default mongoose.model('Project', ProjectSchema);