import { Request, Response } from 'express';
import Invoice from '../models/firestore/Invoice.js';
import { Client } from '../models/firestore/Client.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// @desc    Get all invoices for a user
// @route   GET /api/v2/invoices
// @access  Private
export const getInvoices = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { status, startDate, endDate } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const invoices = await Invoice.findByUser(req.user.id, filters);

    // Populate client information
    const invoicesWithClients = await Promise.all(
      invoices.map(async (invoice) => {
        const client = await Client.findById(invoice.clientId);
        return {
          ...invoice,
          client: client ? { id: client.id, name: client.name, email: client.email } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: invoicesWithClients.length,
      data: invoicesWithClients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/v2/invoices/:id
// @access  Private
export const getInvoice = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    // Check if user owns this invoice
    if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this invoice'
      });
      return;
    }

    // Populate client information
    const client = await Client.findById(invoice.clientId);
    const invoiceWithClient = {
      ...invoice,
      client: client ? { id: client.id, name: client.name, email: client.email } : null
    };

    res.status(200).json({
      success: true,
      data: invoiceWithClient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create invoice
// @route   POST /api/v2/invoices
// @access  Private
export const createInvoice = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    // Verify client exists and belongs to user
    const client = await Client.findById(req.body.clientId);
    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      });
      return;
    }

    if (client.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to create invoice for this client'
      });
      return;
    }

    // Generate invoice number if not provided
    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = await Invoice.getNextInvoiceNumber(req.user.id);
    }

    const invoiceData = {
      ...req.body,
      userId: req.user.id,
      invoiceNumber,
      status: req.body.status || 'draft',
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/v2/invoices/:id
// @access  Private
export const updateInvoice = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    // Check if user owns this invoice
    if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this invoice'
      });
      return;
    }

    // Don't allow changing the invoice to a different user
    delete req.body.userId;

    const updateData = { ...req.body };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedInvoice = await Invoice.update(req.params.id, updateData);

    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/v2/invoices/:id
// @access  Private
export const deleteInvoice = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    // Check if user owns this invoice
    if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this invoice'
      });
      return;
    }

    // Don't allow deleting paid invoices
    if (invoice.status === 'paid') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete paid invoices'
      });
      return;
    }

    await Invoice.delete(req.params.id);

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

// @desc    Mark invoice as paid
// @route   PUT /api/v2/invoices/:id/pay
// @access  Private
export const markInvoiceAsPaid = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    // Check if user owns this invoice
    if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this invoice'
      });
      return;
    }

    const updatedInvoice = await Invoice.markAsPaid(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get invoice summary
// @route   GET /api/v2/invoices/summary
// @access  Private
export const getInvoiceSummary = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const totalsByStatus = await Invoice.getTotalsByStatus(req.user.id);

    res.status(200).json({
      success: true,
      data: totalsByStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};