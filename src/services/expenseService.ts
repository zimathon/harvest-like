import { Expense } from '../types';
import api from './api';

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
export const createExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'> & { project: string }): Promise<Expense> => {
  // APIに送信するデータを作成
  const payload = {
    project: expenseData.project, // <<< expenseData.project をそのまま使う
    category: expenseData.category,
    date: expenseData.date,
    amount: expenseData.amount,
    description: expenseData.description,
    receiptUrl: expenseData.receiptUrl, // receiptUrl が expenseData にあれば含める
    notes: expenseData.notes,
    // status はAPI側でデフォルト設定されるか、必要なら expenseData から渡す
  };
  console.log("Sending payload to /api/expenses:", payload); // 送信するデータを確認

  const response = await api.post('/expenses', payload); // payload を送信
  return response.data.data;
};

// Update expense
export const updateExpense = async (id: string, expenseData: Partial<Expense> & { project?: string }): Promise<Expense> => {
  // APIに送信するデータを作成 (更新なので、存在するフィールドのみ含めるのが一般的)
  const payload: Record<string, any> = {};
  if (expenseData.project) payload.project = expenseData.project; // <<< project キーで渡す
  if (expenseData.category) payload.category = expenseData.category;
  if (expenseData.date) payload.date = expenseData.date;
  if (expenseData.amount !== undefined) payload.amount = expenseData.amount;
  if (expenseData.description) payload.description = expenseData.description;
  if (expenseData.receiptUrl) payload.receiptUrl = expenseData.receiptUrl;
  if (expenseData.notes) payload.notes = expenseData.notes;
  if (expenseData.status) payload.status = expenseData.status;

  console.log(`Sending payload to update /api/expenses/${id}:`, payload);

  const response = await api.put(`/expenses/${id}`, payload);
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