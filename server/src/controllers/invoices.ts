import { Request, Response } from 'express';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js'; // Clientモデルをインポート
import { InvoiceDocument } from '../types/index.js';

// Get all invoices
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().populate('client'); // クライアント情報を取得
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Get single invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Create a new invoice
export const createInvoice = async (req: Request, res: Response) => {
  const { client, number, issueDate, dueDate, amount, tax, status, notes, items } = req.body;

  try {
    // クライアントIDの検証
    const existingClient = await Client.findById(client);
    if (!existingClient) {
      return res.status(400).json({ message: 'Invalid client ID' });
    }

    const newInvoice: InvoiceDocument = new Invoice({
      client,
      number,
      issueDate,
      dueDate,
      amount,
      tax,
      status,
      notes,
      items
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Update an invoice by ID
export const updateInvoice = async (req: Request, res: Response) => {
  const { client, number, issueDate, dueDate, amount, tax, status, notes, items } = req.body;

  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // クライアントIDが更新される場合、そのIDの検証
    if (client) {
      const existingClient = await Client.findById(client);
      if (!existingClient) {
        return res.status(400).json({ message: 'Invalid client ID' });
      }
      invoice.client = client;
    }

    invoice.number = number || invoice.number;
    invoice.issueDate = issueDate || invoice.issueDate;
    invoice.dueDate = dueDate || invoice.dueDate;
    invoice.amount = amount || invoice.amount;
    invoice.tax = tax !== undefined ? tax : invoice.tax;
    invoice.status = status || invoice.status;
    invoice.notes = notes || invoice.notes;
    invoice.items = items || invoice.items;

    const updatedInvoice = await invoice.save();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Delete an invoice by ID
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await invoice.deleteOne(); // Mongoose 5.x/6.x の deleteOne() を使用
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};