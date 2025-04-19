import mongoose from 'mongoose';

const TimeEntrySchema = new mongoose.Schema(
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
    task: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    isBillable: {
      type: Boolean,
      default: true
    },
    isRunning: {
      type: Boolean,
      default: false
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

export default mongoose.model('TimeEntry', TimeEntrySchema);