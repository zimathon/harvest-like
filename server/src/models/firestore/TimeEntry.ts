import { getFirestore, collections } from '../../config/firestore-local.js';
import { Timestamp } from '@google-cloud/firestore';

export interface ITimeEntry {
  id?: string;
  userId: string;
  user?: any; // Will be populated when needed
  projectId: string;
  project?: any; // Will be populated when needed
  taskId: string;
  task?: any; // Task details from project
  date: string; // YYYY-MM-DD format
  startTime?: Timestamp;
  endTime?: Timestamp;
  duration: number; // in seconds
  notes?: string;
  isBillable: boolean;
  isRunning: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class TimeEntryModel {
  private db = getFirestore();
  private collection = this.db.collection(collections.timeEntries);

  async create(entryData: Omit<ITimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITimeEntry> {
    const now = Timestamp.now();
    
    const entry: Omit<ITimeEntry, 'id'> = {
      ...entryData,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(entry);
    return {
      id: docRef.id,
      ...entry
    };
  }

  async findById(id: string, populate?: string[]): Promise<ITimeEntry | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const entry = {
      id: doc.id,
      ...doc.data()
    } as ITimeEntry;

    if (populate?.length) {
      return this.populate(entry, populate);
    }

    return entry;
  }

  async findByUser(userId: string, filters?: {
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ITimeEntry[]> {
    let query = this.collection.where('userId', '==', userId);

    if (filters?.projectId) {
      query = query.where('projectId', '==', filters.projectId);
    }

    if (filters?.startDate) {
      query = query.where('date', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('date', '<=', filters.endDate);
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ITimeEntry));

    // Don't populate here - let controller handle batch fetching
    return entries;
  }

  async findAll(filters?: {
    userId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ITimeEntry[]> {
    let query = this.collection as any;

    if (filters?.userId) {
      query = query.where('userId', '==', filters.userId);
    }

    if (filters?.projectId) {
      query = query.where('projectId', '==', filters.projectId);
    }

    if (filters?.startDate) {
      query = query.where('date', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('date', '<=', filters.endDate);
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    const entries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as ITimeEntry));

    // Don't populate here - let controller handle batch fetching
    return entries;
  }

  async findRunning(userId: string): Promise<ITimeEntry[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('isRunning', '==', true)
      .get();

    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ITimeEntry));

    return Promise.all(entries.map(entry => this.populate(entry, ['project'])));
  }

  async findByProject(projectId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<ITimeEntry[]> {
    let query = this.collection.where('projectId', '==', projectId) as any;

    if (filters?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(filters.startDate));
    }

    if (filters?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(filters.endDate));
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as ITimeEntry));
  }

  async update(id: string, updateData: Partial<ITimeEntry>): Promise<ITimeEntry | null> {
    const updateFields = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key as keyof typeof updateFields] === undefined) {
        delete updateFields[key as keyof typeof updateFields];
      }
    });

    await this.collection.doc(id).update(updateFields);
    return this.findById(id, ['project', 'user']);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private async populate(entry: ITimeEntry, fields: string[]): Promise<ITimeEntry> {
    const populated = { ...entry };

    if (fields.includes('project') && entry.projectId) {
      const projectDoc = await this.db.collection(collections.projects).doc(entry.projectId).get();
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        populated.project = { 
          id: projectDoc.id, 
          ...projectData 
        };
        
        // Get task details from project
        if (entry.taskId && projectData?.tasks) {
          const task = projectData.tasks.find((t: any) => t.id === entry.taskId);
          if (task) {
            populated.task = task;
          }
        }
      }
    }

    if (fields.includes('user') && entry.userId) {
      const userDoc = await this.db.collection(collections.users).doc(entry.userId).get();
      if (userDoc.exists) {
        populated.user = { id: userDoc.id, ...userDoc.data() };
      }
    }

    return populated;
  }
}

export const TimeEntry = new TimeEntryModel();