import api from './api';
import { Expense } from '../types';

// Get user's expenses
export const getMyExpenses = async (params?: {
  project?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> => {
  const response = await api.get('/expenses/me', { params });
  return response.data.data;
};

// Get all expenses (admin only)
export const getAllExpenses = async (params?: {
  user?: string;
  project?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> => {
  const response = await api.get('/expenses', { params });
  return response.data.data;
};

// Get expense by ID
export const getExpenseById = async (id: string): Promise<Expense> => {
  const response = await api.get(`/expenses/${id}`);
  return response.data.data;
};

// Create expense
export const createExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
  const response = await api.post('/expenses', {
    project: expenseData.projectId,
    category: expenseData.category,
    date: expenseData.date,
    amount: expenseData.amount,
    description: expenseData.description,
    receiptUrl: expenseData.receiptUrl,
    notes: expenseData.notes
  });
  return response.data.data;
};

// Update expense
export const updateExpense = async (id: string, expenseData: Partial<Expense>): Promise<Expense> => {
  const response = await api.put(`/expenses/${id}`, {
    project: expenseData.projectId,
    category: expenseData.category,
    date: expenseData.date,
    amount: expenseData.amount,
    description: expenseData.description,
    receiptUrl: expenseData.receiptUrl,
    notes: expenseData.notes
  });
  return response.data.data;
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};

// Update expense status (admin only)
export const updateExpenseStatus = async (id: string, status: 'pending' | 'approved' | 'rejected'): Promise<Expense> => {
  const response = await api.put(`/expenses/${id}/status`, { status });
  return response.data.data;
};