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
  _id?: string; // For backward compatibility
  name: string;
  client?: Client | string; // MongoDB版で使用（オプショナル）
  clientId?: string; // Firestore版で使用
  clientName?: string; // Firestore版で使用（populated）
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on hold';
  budget?: number;
  budgetType?: 'hourly' | 'fixed';
  hourlyRate?: number;
  tasks?: Task[];
  startDate?: string;
  endDate?: string;
  members?: { user: string; role: string }[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// タスク関連の型定義
export interface Task {
  id?: string; // Add id property
  _id?: string; // For backward compatibility
  name: string;
  description?: string;
  rate?: number;
  defaultRate?: number;
  isBillable: boolean;
}

// クライアント関連の型定義
export interface Client {
  id: string;
  _id?: string; // For backward compatibility
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
  _id?: string; // For backward compatibility
  userId: string;
  user?: User;
  projectId?: string;
  project?: Project;
  projectName?: string;
  task?: Task | string;
  taskId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // 時間（小数点）
  hours?: number; // Alternative to duration
  notes?: string;
  description?: string;
  isBillable: boolean;
  isRunning: boolean;
  createdAt?: string;
  updatedAt?: string;
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