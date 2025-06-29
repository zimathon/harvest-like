import { Response } from 'express';
import Project from '../models/Project.js';
import { AuthRequest } from '../types/index.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await Project.find({ user: req.user?.id }).populate('client', 'name');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name')
      .populate('members.user', 'name email');

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to view this project`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Add user to req.body
    req.body.user = req.user?.id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to update this project`
      });
      return;
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to delete this project`
      });
      return;
    }

    await project.deleteOne();

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

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
export const addProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user, role } = req.body;
    
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to add members to this project`
      });
      return;
    }

    // Check if member already exists
    const memberExists = project.members.find(
      member => member.user.toString() === user
    );

    if (memberExists) {
      res.status(400).json({
        success: false,
        error: 'Member already exists'
      });
      return;
    }

    project.members.push({ user, role: role || 'member' });

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
export const removeProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to remove members from this project`
      });
      return;
    }

    project.members = project.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};