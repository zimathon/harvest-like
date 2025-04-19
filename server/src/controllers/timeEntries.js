import TimeEntry from '../models/TimeEntry.js';

// @desc    Get all time entries
// @route   GET /api/time-entries
// @access  Private
export const getTimeEntries = async (req, res) => {
  try {
    let query = {};
    
    // Filter by user if provided
    if (req.query.user) {
      query.user = req.query.user;
    }
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate) };
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
      error: error.message
    });
  }
};

// @desc    Get user's time entries
// @route   GET /api/time-entries/me
// @access  Private
export const getMyTimeEntries = async (req, res) => {
  try {
    let query = { user: req.user.id };
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate) };
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
      error: error.message
    });
  }
};

// @desc    Get single time entry
// @route   GET /api/time-entries/:id
// @access  Private
export const getTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id)
      .populate('user', 'name')
      .populate('project', 'name');

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new time entry
// @route   POST /api/time-entries
// @access  Private
export const createTimeEntry = async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;
    
    const timeEntry = await TimeEntry.create(req.body);

    res.status(201).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update time entry
// @route   PUT /api/time-entries/:id
// @access  Private
export const updateTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
    }

    // Make sure user owns the time entry
    if (timeEntry.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this time entry'
      });
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
      error: error.message
    });
  }
};

// @desc    Delete time entry
// @route   DELETE /api/time-entries/:id
// @access  Private
export const deleteTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
    }

    // Make sure user owns the time entry
    if (timeEntry.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this time entry'
      });
    }

    await timeEntry.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Start timer
// @route   POST /api/time-entries/timer/start
// @access  Private
export const startTimer = async (req, res) => {
  try {
    // Check if user has any running timers
    const runningTimer = await TimeEntry.findOne({
      user: req.user.id,
      isRunning: true
    });

    if (runningTimer) {
      return res.status(400).json({
        success: false,
        error: 'You already have a running timer'
      });
    }

    // Add user to req.body
    req.body.user = req.user.id;
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
      error: error.message
    });
  }
};

// @desc    Stop timer
// @route   PUT /api/time-entries/timer/stop
// @access  Private
export const stopTimer = async (req, res) => {
  try {
    // Find running timer
    const runningTimer = await TimeEntry.findOne({
      user: req.user.id,
      isRunning: true
    });

    if (!runningTimer) {
      return res.status(404).json({
        success: false,
        error: 'No running timer found'
      });
    }

    // Calculate duration
    const startTime = new Date(runningTimer.startTime);
    const endTime = new Date();
    const durationInHours = (endTime - startTime) / (1000 * 60 * 60);
    
    // Update timer
    runningTimer.isRunning = false;
    runningTimer.endTime = endTime;
    runningTimer.duration = parseFloat(durationInHours.toFixed(2));
    
    await runningTimer.save();

    res.status(200).json({
      success: true,
      data: runningTimer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};