import { Response } from 'express';
import Client from '../models/Client.js';
import { AuthRequest } from '../types/index.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = { user: req.user?.id };
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    const clients = await Client.find(query).sort({ name: 1 });

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
// @route   GET /api/clients/:id
// @access  Private
export const getClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to view this client`
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
// @route   POST /api/clients
// @access  Private
export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Add user to req.body
    req.body.user = req.user?.id;

    const client = await Client.create(req.body);

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
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to update this client`
      });
      return;
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

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
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    // Make sure user owns client
    if (client.user.toString() !== req.user?.id) {
      res.status(401).json({
        success: false,
        error: `User ${req.user?.id} is not authorized to delete this client`
      });
      return;
    }

    await client.deleteOne();

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