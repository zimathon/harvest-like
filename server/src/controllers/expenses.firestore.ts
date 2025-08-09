import { Request, Response } from 'express';
import Expense from '../models/firestore/Expense.js';
import { AuthRequestFirestore } from '../types/firestore.js';

// @desc    Get all expenses for a user
// @route   GET /api/v2/expenses
// @access  Private
export const getExpenses = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate, category } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (category) filters.category = category as string;

    const expenses = await Expense.findByUser(req.user.id, filters);

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Get single expense
// @route   GET /api/v2/expenses/:id
// @access  Private
export const getExpense = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    // Check if user owns this expense
    if (expense.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this expense'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Create expense
// @route   POST /api/v2/expenses
// @access  Private
export const createExpense = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const expenseData = {
      ...req.body,
      userId: req.user.id,
      date: req.body.date ? new Date(req.body.date) : new Date()
    };

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/v2/expenses/:id
// @access  Private
export const updateExpense = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    // Check if user owns this expense
    if (expense.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this expense'
      });
      return;
    }

    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const updatedExpense = await Expense.update(req.params.id, updateData);

    res.status(200).json({
      success: true,
      data: updatedExpense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/v2/expenses/:id
// @access  Private
export const deleteExpense = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
      return;
    }

    // Check if user owns this expense
    if (expense.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this expense'
      });
      return;
    }

    await Expense.delete(req.params.id);

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

// @desc    Get expense summary
// @route   GET /api/v2/expenses/summary
// @access  Private
export const getExpenseSummary = async (req: AuthRequestFirestore, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const total = await Expense.getTotalByUser(req.user.id, filters);
    const byCategory = await Expense.getByCategory(req.user.id, filters);

    res.status(200).json({
      success: true,
      data: {
        total,
        byCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server Error'
    });
  }
};