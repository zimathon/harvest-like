import { Request, Response } from 'express';
import { Project } from '../models/firestore/Project.js';
import { Client } from '../models/firestore/Client.js';
import User from '../models/firestore/User.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// @desc    Get all projects
// @route   GET /api/v2/projects
// @access  Private
export const getProjects = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const projects = await Project.findByUser(req.user.id);

    // Populate client names
    const projectsWithClients = await Promise.all(
      projects.map(async (project) => {
        const client = await Client.findById(project.clientId);
        return {
          ...project,
          clientName: client?.name || 'Unknown Client'
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projectsWithClients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single project
// @route   GET /api/v2/projects/:id
// @access  Private
export const getProject = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this project'
      });
      return;
    }

    // Populate client and members
    const client = await Client.findById(project.clientId || project.client);
    const membersWithDetails = await Promise.all(
      project.members.map(async (member) => {
        const user = await User.findById(member.user);
        return {
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email
          } : null,
          role: member.role
        };
      })
    );

    const projectWithDetails = {
      ...project,
      clientDetails: client,
      clientName: client?.name || 'Unknown Client',
      members: membersWithDetails
    };

    res.status(200).json({
      success: true,
      data: projectWithDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create new project
// @route   POST /api/v2/projects
// @access  Private
export const createProject = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { clientId, client, ...projectData } = req.body;

    // Check if clientId or client is provided (support both field names)
    const actualClientId = clientId || client;
    if (!actualClientId) {
      res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
      return;
    }

    // Verify client exists and belongs to user
    const clientDoc = await Client.findById(actualClientId);
    if (!clientDoc) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    if (clientDoc.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to use this client'
      });
      return;
    }

    const project = await Project.create({
      ...projectData,
      clientId: actualClientId,
      userId: req.user.id,
      members: projectData.members || [],
      tasks: projectData.tasks || []
    });

    // Add clientName to response
    const projectWithClient = {
      ...project,
      clientName: clientDoc.name || 'Unknown Client'
    };

    res.status(201).json({
      success: true,
      data: projectWithClient
    });
  } catch (error) {
    console.error('❌ Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update project
// @route   PUT /api/v2/projects/:id
// @access  Private
export const updateProject = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to update this project'
      });
      return;
    }

    // If updating client, verify it exists and belongs to user
    const newClientId = req.body.clientId || req.body.client;
    if (newClientId) {
      const client = await Client.findById(newClientId);
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Client not found'
        });
        return;
      }

      if (client.userId !== req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Not authorized to use this client'
        });
        return;
      }
    }

    // Prepare update data with proper clientId field
    const updateData = { ...req.body };
    if (newClientId) {
      updateData.clientId = newClientId;
      delete updateData.client; // Remove client field if it exists
    }

    project = await Project.update(req.params.id, updateData);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Add clientName to response
    const clientDoc = await Client.findById(project.clientId);
    const projectWithClient = {
      ...project,
      clientName: clientDoc?.name || 'Unknown Client'
    };

    res.status(200).json({
      success: true,
      data: projectWithClient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/v2/projects/:id
// @access  Private
export const deleteProject = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
      return;
    }

    await Project.delete(req.params.id);

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
// @route   POST /api/v2/projects/:id/members
// @access  Private
export const addProjectMember = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { userId, role = 'member' } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to modify this project'
      });
      return;
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if user is already a member
    const isMember = project.members.some(member => member.user === userId);
    if (isMember) {
      res.status(400).json({
        success: false,
        error: 'User is already a member of this project'
      });
      return;
    }

    // Add member
    const updatedMembers = [...project.members, { user: userId, role }];
    const updatedProject = await Project.update(req.params.id, { members: updatedMembers });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/v2/projects/:id/members/:userId
// @access  Private
export const removeProjectMember = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Make sure user owns project
    if (project.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to modify this project'
      });
      return;
    }

    // Remove member
    const updatedMembers = project.members.filter(member => member.user !== req.params.userId);
    
    if (updatedMembers.length === project.members.length) {
      res.status(404).json({
        success: false,
        error: 'User is not a member of this project'
      });
      return;
    }

    const updatedProject = await Project.update(req.params.id, { members: updatedMembers });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};