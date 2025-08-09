import { Timestamp } from '@google-cloud/firestore';
import { getFirestore } from '../../config/firestore-local.js';
import { collections } from '../../config/firestore-local.js';

export interface IExpense {
  id?: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: Timestamp;
  projectId?: string;
  clientId?: string;
  isReimbursable?: boolean;
  receipt?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class ExpenseModel {
  private db: any;
  private collection: any;
  
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(collections.expenses);
  }

  async create(expenseData: Omit<IExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<IExpense> {
    const now = Timestamp.now();
    
    const expense: Omit<IExpense, 'id'> = {
      ...expenseData,
      date: expenseData.date instanceof Date ? Timestamp.fromDate(expenseData.date) : expenseData.date,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(expense);
    return {
      id: docRef.id,
      ...expense
    };
  }

  async findById(id: string): Promise<IExpense | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    } as IExpense;
  }

  async findByUser(userId: string, filters?: { startDate?: Date; endDate?: Date; category?: string }): Promise<IExpense[]> {
    let query = this.collection.where('userId', '==', userId);
    
    if (filters?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(filters.endDate));
    }
    
    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }
    
    const snapshot = await query.orderBy('date', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async update(id: string, updateData: Partial<IExpense>): Promise<IExpense | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }

    const updates = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    if (updates.date && updates.date instanceof Date) {
      updates.date = Timestamp.fromDate(updates.date);
    }

    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as IExpense;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  async list(filters?: { userId?: string; startDate?: Date; endDate?: Date; category?: string }): Promise<IExpense[]> {
    let query = this.collection as any;
    
    if (filters?.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    
    if (filters?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(filters.endDate));
    }
    
    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }
    
    const snapshot = await query.orderBy('date', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getTotalByUser(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<number> {
    const expenses = await this.findByUser(userId, filters);
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  async getByCategory(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<{ category: string; total: number }[]> {
    const expenses = await this.findByUser(userId, filters);
    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });
    
    return Object.entries(categoryTotals).map(([category, total]) => ({ category, total }));
  }
}

export default new ExpenseModel();