import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: UserDocument;
}

// User
export interface User {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
}

export interface UserDocument extends User, Document {
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Project
export interface ProjectMember {
  user: Types.ObjectId;
  role: string;
}

export interface ProjectTask {
  name: string;
  hourlyRate?: number;
  isBillable: boolean;
}

export interface Project {
  name: string;
  client: Types.ObjectId;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on hold';
  budget?: number;
  budgetType?: 'hourly' | 'fixed';
  hourlyRate?: number;
  members: ProjectMember[];
  tasks: ProjectTask[];
}

export interface ProjectDocument extends Project, Document {}

// Client
export interface Client {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
}

export interface ClientDocument extends Client, Document {}

// Time Entry
export interface TimeEntry {
  user: Types.ObjectId;
  project: Types.ObjectId;
  task: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  notes?: string;
  isBillable: boolean;
  isRunning: boolean;
  invoice?: Types.ObjectId;
}

export interface TimeEntryDocument extends TimeEntry, Document {}

// Expense
export interface Expense {
  user: Types.ObjectId;
  project: Types.ObjectId;
  category: string;
  date: Date;
  amount: number;
  description: string;
  receiptUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  invoice?: Types.ObjectId;
}

export interface ExpenseDocument extends Expense, Document {}

// Invoice
export interface InvoiceItem {
  type: 'time' | 'expense' | 'item';
  reference?: Types.ObjectId;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface Invoice {
  client: Types.ObjectId;
  number: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  tax?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  items: InvoiceItem[];
}

export interface InvoiceDocument extends Invoice, Document {
  totalAmount: number;
}