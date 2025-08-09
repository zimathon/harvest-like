// ユーザー関連の型定義
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
  createdAt: string;
}

// プロジェクト関連の型定義
export interface Project {
  id: string;
  name: string;
  client?: Client; // MongoDB版で使用（オプショナル）
  clientId?: string; // Firestore版で使用
  clientName?: string; // Firestore版で使用（populated）
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on hold';
  budget?: number;
  budgetType?: 'hourly' | 'fixed';
  hourlyRate?: number;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

// タスク関連の型定義
export interface Task {
  id?: string; // Add id property
  name: string;
  defaultRate?: number;
  isBillable: boolean;
}

// クライアント関連の型定義
export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// 時間記録の型定義
export interface TimeEntry {
  id: string;
  userId: string;
  project: Project;
  task: Task;
  date: string;
  startTime?: string;
  endTime?: string;
  duration: number; // 時間（小数点）
  notes?: string;
  isBillable: boolean;
  isRunning: boolean;
  createdAt: string;
  updatedAt: string;
}

// 経費の型定義
export interface Expense {
  id: string;
  userId: string;
  project: Project;
  category: string;
  date: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// 請求書の型定義
export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  tax?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  timeEntries?: string[]; // TimeEntry IDs
  expenses?: string[];    // Expense IDs
  createdAt: string;
  updatedAt: string;
}