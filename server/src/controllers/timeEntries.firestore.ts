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

    // Batch fetch all users and projects
    const userIds = [...new Set(entries.map(e => e.userId).filter(Boolean))];
    const projectIds = [...new Set(entries.map(e => e.projectId).filter(Boolean))];
    
    const [users, projects] = await Promise.all([
      User.findByIds(userIds),
      Project.findByIds(projectIds)
    ]);
    
    const userMap = new Map(users.map(u => [u.id, u]));
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Map names without individual queries
    const entriesWithDetails = entries.map((entry) => {
      const user = userMap.get(entry.userId);
      const project = projectMap.get(entry.projectId);
      return {
        ...entry,
        userName: user?.name || 'Unknown User',
        projectName: project?.name || 'Unknown Project'
      };
    });

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

    // Batch fetch all projects
    const projectIds = [...new Set(entries.map(e => e.projectId).filter(Boolean))];
    const projects = await Project.findByIds(projectIds);
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Map project names without individual queries
    const entriesWithProjects = entries.map((entry) => {
      const project = projectMap.get(entry.projectId);
      
      // Debug logging for unusual duration values
      const hours = entry.duration / 3600; // Convert seconds to hours
      if (hours > 24) {
        console.log('⚠️ Unusual duration detected:', {
          id: entry.id,
          hours: hours,
          duration: entry.duration,
          date: entry.date
        });
      }
      
      return {
        ...entry,
        projectName: project?.name || 'Unknown Project'
      };
    });

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

// @desc    Resume timer for an existing time entry
// @route   PUT /api/v2/time-entries/:id/timer/resume
// @access  Private
export const resumeTimer = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { id } = req.params;

    // Check if entry exists and belongs to user
    const existingEntry = await TimeEntry.findById(id);
    if (!existingEntry) {
      res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
      return;
    }

    if (existingEntry.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to modify this entry'
      });
      return;
    }

    // Stop any running timers first
    const runningEntries = await TimeEntry.findRunning(req.user.id);
    for (const entry of runningEntries) {
      const endTime = Timestamp.now();
      const duration = Math.floor((endTime.toMillis() - entry.startTime.toMillis()) / 1000);
      await TimeEntry.update(entry.id!, {
        endTime: endTime,
        duration,
        isRunning: false
      });
    }

    // Resume the timer for the existing entry
    // Use hours field if available (more reliable), otherwise use duration
    let baseDuration = 0;
    const entryWithHours = existingEntry as any;
    if (entryWithHours.hours && entryWithHours.hours > 0) {
      // Convert hours to seconds
      baseDuration = Math.round(entryWithHours.hours * 3600);
    } else if (existingEntry.duration && existingEntry.duration > 0) {
      baseDuration = existingEntry.duration;
    }
    
    const updatedEntry = await TimeEntry.update(id, {
      startTime: Timestamp.now(),
      endTime: null,
      isRunning: true,
      // Store the base duration (converted from hours if needed)
      duration: baseDuration
    });

    // Populate the project data for the response
    const populatedEntry = await TimeEntry.findById(id, ['project', 'user']);

    res.status(200).json({
      success: true,
      data: populatedEntry
    });
  } catch (error) {
    console.error('❌ Error resuming timer:', error);
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
    
    // Calculate duration in seconds for this session
    const sessionDuration = Math.floor((endTime.toMillis() - startTime.toMillis()) / 1000);
    
    // Add session duration to the existing duration (which was preserved when resuming)
    const existingDuration = runningEntry.duration || 0;
    const totalDuration = existingDuration + sessionDuration;

    const updateData: any = {
      endTime: endTime,
      duration: totalDuration,
      hours: totalDuration / 3600, // Also update hours field for consistency
      isRunning: false,
      notes: req.body.notes || runningEntry.notes
    };
    
    const updatedEntry = await TimeEntry.update(runningEntry.id!, updateData);

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