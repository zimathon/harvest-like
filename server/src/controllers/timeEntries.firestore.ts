import { Request, Response } from 'express';
import { TimeEntry } from '../models/firestore/TimeEntry.js';
import { Project } from '../models/firestore/Project.js';
import User from '../models/firestore/User.js';
import { AuthRequestFirestore } from '../types/firestore.js';
import { Timestamp } from '@google-cloud/firestore';

// @desc    Get all time entries
// @route   GET /api/v2/time-entries
// @access  Private/Admin
export const getTimeEntries = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Only admin can get all entries
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access all time entries'
      });
      return;
    }

    const { user, project, startDate, endDate } = req.query;

    // Build filter object
    const filters: any = {};
    if (user) filters.userId = user as string;
    if (project) filters.projectId = project as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const entries = await TimeEntry.findAll(filters);

    // Populate user and project names
    const entriesWithDetails = await Promise.all(
      entries.map(async (entry) => {
        const [user, project] = await Promise.all([
          User.findById(entry.userId),
          Project.findById(entry.projectId)
        ]);
        return {
          ...entry,
          userName: user?.name || 'Unknown User',
          projectName: project?.name || 'Unknown Project'
        };
      })
    );

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entriesWithDetails
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get current user's time entries
// @route   GET /api/v2/time-entries/me
// @access  Private
export const getMyTimeEntries = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { project, startDate, endDate } = req.query;

    // Build filter object
    const filters: any = {
      userId: req.user.id
    };
    if (project) filters.projectId = project as string;
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const entries = await TimeEntry.findByUser(req.user.id, filters);

    // Populate project names
    const entriesWithProjects = await Promise.all(
      entries.map(async (entry) => {
        const project = await Project.findById(entry.projectId);
        return {
          ...entry,
          projectName: project?.name || 'Unknown Project'
        };
      })
    );

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entriesWithProjects
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single time entry
// @route   GET /api/v2/time-entries/:id
// @access  Private
export const getTimeEntry = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const entry = await TimeEntry.findById(req.params.id, ['user', 'project']);

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    // Check authorization
    if (entry.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view this time entry'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create time entry
// @route   POST /api/v2/time-entries
// @access  Private
export const createTimeEntry = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Check if projectId is provided
    if (!req.body.projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
      return;
    }

    // Verify project exists and user has access
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Check if user owns the project or is a member
    const isOwner = project.userId === req.user.id;
    const isMember = project.members && Array.isArray(project.members) 
      ? project.members.some(member => member.user === req.user.id)
      : false;
    
    if (!isOwner && !isMember && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to log time for this project'
      });
      return;
    }

    const entry = await TimeEntry.create({
      ...req.body,
      userId: req.user.id
    });

    // Populate the project data for the response
    const populatedEntry = await TimeEntry.findById(entry.id!, ['project', 'user']);

    res.status(201).json({
      success: true,
      data: populatedEntry
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update time entry
// @route   PUT /api/v2/time-entries/:id
// @access  Private
export const updateTimeEntry = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    let entry = await TimeEntry.findById(req.params.id);

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    // Check authorization
    if (entry.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this time entry'
      });
      return;
    }

    // If updating project, verify access
    if (req.body.projectId && req.body.projectId !== entry.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found'
        });
        return;
      }

      const isOwner = project.userId === req.user.id;
      const isMember = project.members && Array.isArray(project.members)
        ? project.members.some(member => member.user === req.user.id)
        : false;
      
      if (!isOwner && !isMember && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Not authorized to log time for this project'
        });
        return;
      }
    }

    entry = await TimeEntry.update(req.params.id, req.body);

    // Populate the project data for the response
    const populatedEntry = await TimeEntry.findById(req.params.id, ['project', 'user']);

    res.status(200).json({
      success: true,
      data: populatedEntry
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete time entry
// @route   DELETE /api/v2/time-entries/:id
// @access  Private
export const deleteTimeEntry = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const entry = await TimeEntry.findById(req.params.id);

    if (!entry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    // Check authorization
    if (entry.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this time entry'
      });
      return;
    }

    await TimeEntry.delete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Start timer
// @route   POST /api/v2/time-entries/timer/start
// @access  Private
export const startTimer = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Check if user already has a running timer
    const runningEntries = await TimeEntry.findRunning(req.user.id);
    
    if (runningEntries.length > 0) {
      res.status(400).json({
        success: false,
        error: 'You already have a running timer'
      });
      return;
    }

    // Verify project exists and user has access
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    const isOwner = project.userId === req.user.id;
    const isMember = project.members && Array.isArray(project.members)
      ? project.members.some(member => member.user === req.user.id)
      : false;
    
    if (!isOwner && !isMember && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to log time for this project'
      });
      return;
    }

    const entry = await TimeEntry.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      task: req.body.task || req.body.taskId,  // Store as 'task' field for consistency
      taskId: req.body.taskId || req.body.task,
      date: new Date().toISOString().split('T')[0],
      startTime: Timestamp.now(),
      duration: 0,
      notes: req.body.notes || '',
      isBillable: req.body.isBillable !== undefined ? req.body.isBillable : true,
      isRunning: true
    });

    // Populate the project data for the response
    const populatedEntry = await TimeEntry.findById(entry.id!, ['project', 'user']);

    res.status(201).json({
      success: true,
      data: populatedEntry
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Stop timer
// @route   PUT /api/v2/time-entries/timer/stop
// @access  Private
export const stopTimer = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Find running timer for user
    const runningEntries = await TimeEntry.findRunning(req.user.id);
    
    if (runningEntries.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No running timer found'
      });
      return;
    }

    const runningEntry = runningEntries[0];
    const endTime = Timestamp.now();
    const startTime = runningEntry.startTime;
    
    // Calculate duration in seconds
    const duration = Math.floor((endTime.toMillis() - startTime.toMillis()) / 1000);

    const updatedEntry = await TimeEntry.update(runningEntry.id!, {
      endTime: endTime,
      duration,
      isRunning: false,
      notes: req.body.notes || runningEntry.notes
    });

    // Populate the project data for the response
    const populatedEntry = await TimeEntry.findById(runningEntry.id!, ['project', 'user']);

    res.status(200).json({
      success: true,
      data: populatedEntry
    });
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};