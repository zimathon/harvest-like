import { Request, Response } from 'express';
import { Client } from '../models/firestore/Client.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// @desc    Get all clients
// @route   GET /api/v2/clients
// @access  Private
export const getClients = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const clients = await Client.findByUser(req.user.id);

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single client
// @route   GET /api/v2/clients/:id
// @access  Private
export const getClient = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user.id} is not authorized to view this client`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create new client
// @route   POST /api/v2/clients
// @access  Private
export const createClient = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Check if client with same email already exists for this user
    if (req.body.email) {
      const existingClients = await Client.findByUser(req.user.id);
      const emailExists = existingClients.some(client => 
        client.email?.toLowerCase() === req.body.email.toLowerCase()
      );
      
      if (emailExists) {
        res.status(400).json({
          success: false,
          error: 'A client with this email already exists'
        });
        return;
      }
    }

    const client = await Client.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update client
// @route   PUT /api/v2/clients/:id
// @access  Private
export const updateClient = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    let client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user.id} is not authorized to update this client`
      });
      return;
    }

    // Check if email is being updated to a duplicate
    if (req.body.email && req.body.email !== client.email) {
      const existingClients = await Client.findByUser(req.user.id);
      const emailExists = existingClients.some(c => 
        c.id !== client.id && c.email?.toLowerCase() === req.body.email.toLowerCase()
      );
      
      if (emailExists) {
        res.status(400).json({
          success: false,
          error: 'A client with this email already exists'
        });
        return;
      }
    }

    client = await Client.update(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/v2/clients/:id
// @access  Private
export const deleteClient = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.userId !== req.user.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user.id} is not authorized to delete this client`
      });
      return;
    }

    await Client.delete(req.params.id);

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