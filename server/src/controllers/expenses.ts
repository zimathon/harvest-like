import { Request, Response } from 'express';
import Expense from '../models/Expense.js';
import { AuthRequest } from '../types/index.js';

interface ExpenseQuery {
  user?: string;
  project?: string;
  status?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: ExpenseQuery = {};
    
    // Filter by user if provided
    if (req.query.user) {
      query.user = req.query.user as string;
    }
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project as string;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status as string;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate as string) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate as string) };
    }
    
    // Get expenses
    const expenses = await Expense.find(query)
      .populate('user', 'name')
      .populate('project', 'name')
      .sort({ date: -1 });

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

// @desc    Get user's expenses
// @route   GET /api/expenses/me
// @access  Private
export const getMyExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    let query: ExpenseQuery = { user: req.user._id.toString() };
    
    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project as string;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status as string;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate as string) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate as string) };
    }
    
    // Get expenses
    const expenses = await Expense.find(query)
      .populate('project', 'name')
      .sort({ date: -1 });

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
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('user', 'name')
      .populate('project', 'name');

    if (!expense) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
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

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }
    
    // Add user to req.body
    req.body.user = req.user._id;
    
    const expense = await Expense.create(req.body);

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
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
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

    // Make sure user owns the expense
    if (expense.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this expense'
      });
      return;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
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

    // Make sure user owns the expense
    if (expense.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this expense'
      });
      return;
    }

    await expense.deleteOne();

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

// @desc    Update expense status
// @route   PUT /api/expenses/:id/status
// @access  Private/Admin
export const updateExpenseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Please provide a valid status'
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

    expense.status = status as 'pending' | 'approved' | 'rejected';
    
    await expense.save();

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