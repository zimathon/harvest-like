import { Request, Response } from 'express';
import TimeEntry from '../models/TimeEntry.js';
import { AuthRequest } from '../types/index.js';

interface TimeEntryQuery {
  user?: string;
  project?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// @desc    Get all time entries
// @route   GET /api/time-entries
// @access  Private
export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: TimeEntryQuery = {};
    
    // Filter by user if provided
    if (req.query.user) {
      query.user = req.query.user as string;
    }
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project as string;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate as string) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate as string) };
    }
    
    // Get time entries
    const timeEntries = await TimeEntry.find(query)
      .populate('user', 'name')
      .populate('project', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get user's time entries
// @route   GET /api/time-entries/me
// @access  Private
export const getMyTimeEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    let query: TimeEntryQuery = { user: req.user._id.toString() };
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project as string;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate as string) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate as string) };
    }
    
    // Get time entries
    const timeEntries = await TimeEntry.find(query)
      .populate('project', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single time entry
// @route   GET /api/time-entries/:id
// @access  Private
export const getTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id)
      .populate('user', 'name')
      .populate('project', 'name');

    if (!timeEntry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create new time entry
// @route   POST /api/time-entries
// @access  Private
export const createTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    // Add user to req.body
    req.body.user = req.user._id;
    
    const timeEntry = await TimeEntry.create(req.body);

    res.status(201).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update time entry
// @route   PUT /api/time-entries/:id
// @access  Private
export const updateTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    // Make sure user owns the time entry
    if (timeEntry.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this time entry'
      });
      return;
    }

    const updatedTimeEntry = await TimeEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTimeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete time entry
// @route   DELETE /api/time-entries/:id
// @access  Private
export const deleteTimeEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    // Make sure user owns the time entry
    if (timeEntry.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this time entry'
      });
      return;
    }

    await timeEntry.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Start timer
// @route   POST /api/time-entries/timer/start
// @access  Private
export const startTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    // Check if user has any running timers
    const runningTimer = await TimeEntry.findOne({
      user: req.user._id,
      isRunning: true
    });

    if (runningTimer) {
      res.status(400).json({
        success: false,
        error: 'You already have a running timer'
      });
      return;
    }

    // Add user to req.body
    req.body.user = req.user._id;
    req.body.isRunning = true;
    req.body.startTime = new Date();
    req.body.duration = 0;
    
    const timeEntry = await TimeEntry.create(req.body);

    res.status(201).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Stop timer
// @route   PUT /api/time-entries/timer/stop
// @access  Private
export const stopTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    // Find running timer
    const runningTimer = await TimeEntry.findOne({
      user: req.user._id,
      isRunning: true
    });

    if (!runningTimer) {
      res.status(404).json({
        success: false,
        error: 'No running timer found'
      });
      return;
    }

    // Calculate duration
    if (!runningTimer.startTime) {
      res.status(400).json({
        success: false,
        error: 'Timer has no start time'
      });
      return;
    }
    
    const startTime = new Date(runningTimer.startTime);
    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Update timer
    runningTimer.isRunning = false;
    runningTimer.endTime = endTime;
    runningTimer.duration = durationInSeconds;
    
    await runningTimer.save();

    res.status(200).json({
      success: true,
      data: runningTimer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};