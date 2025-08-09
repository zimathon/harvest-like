import { Timestamp } from '@google-cloud/firestore';
import { getFirestore } from '../../config/firestore-local.js';
import { collections } from '../../config/firestore-local.js';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface IInvoice {
  id?: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  items: IInvoiceItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate?: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  notes?: string;
  terms?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class InvoiceModel {
  private db: any;
  private collection: any;
  
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(collections.invoices);
  }

  private calculateTotals(items: IInvoiceItem[], tax: number = 0): { subtotal: number; total: number } {
    const subtotal = items.reduce((sum, item) => {
      const amount = item.quantity * item.rate;
      item.amount = amount;
      return sum + amount;
    }, 0);
    
    const total = subtotal + (subtotal * tax / 100);
    
    return { subtotal, total };
  }

  async create(invoiceData: Omit<IInvoice, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total'>): Promise<IInvoice> {
    const now = Timestamp.now();
    const { subtotal, total } = this.calculateTotals(invoiceData.items, invoiceData.tax || 0);
    
    const invoice: Omit<IInvoice, 'id'> = {
      ...invoiceData,
      subtotal,
      total,
      issueDate: invoiceData.issueDate || now,
      dueDate: invoiceData.dueDate instanceof Date ? Timestamp.fromDate(invoiceData.dueDate) : invoiceData.dueDate,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(invoice);
    return {
      id: docRef.id,
      ...invoice
    };
  }

  async findById(id: string): Promise<IInvoice | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    } as IInvoice;
  }

  async findByUser(userId: string, filters?: { status?: string; startDate?: Date; endDate?: Date }): Promise<IInvoice[]> {
    let query = this.collection.where('userId', '==', userId);
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters?.startDate) {
      query = query.where('issueDate', '>=', Timestamp.fromDate(filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where('issueDate', '<=', Timestamp.fromDate(filters.endDate));
    }
    
    const snapshot = await query.orderBy('issueDate', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async findByClient(clientId: string): Promise<IInvoice[]> {
    const snapshot = await this.collection
      .where('clientId', '==', clientId)
      .orderBy('issueDate', 'desc')
      .get();
      
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async update(id: string, updateData: Partial<IInvoice>): Promise<IInvoice | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }

    const updates: any = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    // Recalculate totals if items are updated
    if (updates.items) {
      const { subtotal, total } = this.calculateTotals(updates.items, updates.tax || doc.data().tax || 0);
      updates.subtotal = subtotal;
      updates.total = total;
    }

    // Convert dates to Timestamps
    if (updates.dueDate instanceof Date) {
      updates.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    if (updates.paidDate instanceof Date) {
      updates.paidDate = Timestamp.fromDate(updates.paidDate);
    }

    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as IInvoice;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  async list(filters?: { userId?: string; status?: string; startDate?: Date; endDate?: Date }): Promise<IInvoice[]> {
    let query = this.collection as any;
    
    if (filters?.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters?.startDate) {
      query = query.where('issueDate', '>=', Timestamp.fromDate(filters.startDate));
    }
    
    if (filters?.endDate) {
      query = query.where('issueDate', '<=', Timestamp.fromDate(filters.endDate));
    }
    
    const snapshot = await query.orderBy('issueDate', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getNextInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    // Get the latest invoice for this user
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('invoiceNumber', '>=', prefix)
      .orderBy('invoiceNumber', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return `${prefix}001`;
    }
    
    const lastInvoice = snapshot.docs[0].data();
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextNumber}`;
  }

  async getTotalsByStatus(userId: string): Promise<{ [status: string]: number }> {
    const invoices = await this.findByUser(userId);
    const totals: { [status: string]: number } = {};
    
    invoices.forEach(invoice => {
      if (!totals[invoice.status]) {
        totals[invoice.status] = 0;
      }
      totals[invoice.status] += invoice.total || 0;
    });
    
    return totals;
  }

  async markAsPaid(id: string): Promise<IInvoice | null> {
    return this.update(id, {
      status: 'paid',
      paidDate: Timestamp.now()
    });
  }

  async updateOverdueInvoices(): Promise<void> {
    const now = Timestamp.now();
    const snapshot = await this.collection
      .where('status', '==', 'sent')
      .where('dueDate', '<', now)
      .get();
    
    const batch = this.db.batch();
    
    snapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, { status: 'overdue', updatedAt: now });
    });
    
    await batch.commit();
  }
}

export default new InvoiceModel();