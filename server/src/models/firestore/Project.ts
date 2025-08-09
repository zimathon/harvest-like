import { getFirestore, collections } from '../../config/firestore-local.js';
import { Timestamp } from '@google-cloud/firestore';

export interface ITask {
  id: string;
  name: string;
  hourlyRate?: number;
  isBillable: boolean;
}

export interface IProjectMember {
  user: string;
  role: string;
}

export interface IProject {
  id?: string;
  name: string;
  description?: string;
  clientId: string;
  client?: any; // Will be populated when needed
  userId: string;
  user?: any; // Will be populated when needed
  budget?: number;
  budgetType?: 'hourly' | 'fixed';
  hourlyRate?: number;
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  tasks: ITask[];
  members: IProjectMember[];
  startDate?: Timestamp;
  endDate?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class ProjectModel {
  private db = getFirestore();
  private collection = this.db.collection(collections.projects);

  async create(projectData: Omit<IProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<IProject> {
    const now = Timestamp.now();
    
    // Ensure tasks have IDs
    const tasksWithIds = projectData.tasks.map((task, index) => ({
      ...task,
      id: task.id || `task_${Date.now()}_${index}`
    }));
    
    const project: Omit<IProject, 'id'> = {
      ...projectData,
      tasks: tasksWithIds,
      members: projectData.members || [],
      budgetType: projectData.budgetType || 'hourly',
      startDate: projectData.startDate || now,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(project);
    return {
      id: docRef.id,
      ...project
    };
  }

  async findById(id: string, populate?: string[]): Promise<IProject | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const project = {
      id: doc.id,
      ...doc.data()
    } as IProject;

    // Populate references if requested
    if (populate?.includes('client') && project.clientId) {
      const clientDoc = await this.db.collection(collections.clients).doc(project.clientId).get();
      if (clientDoc.exists) {
        project.client = { id: clientDoc.id, ...clientDoc.data() };
      }
    }

    if (populate?.includes('user') && project.userId) {
      const userDoc = await this.db.collection(collections.users).doc(project.userId).get();
      if (userDoc.exists) {
        project.user = { id: userDoc.id, ...userDoc.data() };
      }
    }

    return project;
  }

  async findByUser(userId: string): Promise<IProject[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IProject));
  }

  async findByClient(clientId: string): Promise<IProject[]> {
    const snapshot = await this.collection
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IProject));
  }

  async findAll(populate?: string[]): Promise<IProject[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .get();

    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IProject));

    // Populate if needed
    if (populate?.length) {
      return Promise.all(
        projects.map(project => this.populate(project, populate))
      );
    }

    return projects;
  }

  async update(id: string, updateData: Partial<IProject>): Promise<IProject | null> {
    const updateFields = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    // Ensure tasks have IDs if updating tasks
    if (updateFields.tasks) {
      updateFields.tasks = updateFields.tasks.map((task, index) => ({
        ...task,
        id: task.id || `task_${Date.now()}_${index}`
      }));
    }

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key as keyof typeof updateFields] === undefined) {
        delete updateFields[key as keyof typeof updateFields];
      }
    });

    await this.collection.doc(id).update(updateFields);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private async populate(project: IProject, fields: string[]): Promise<IProject> {
    const populated = { ...project };

    if (fields.includes('client') && project.clientId) {
      const clientDoc = await this.db.collection(collections.clients).doc(project.clientId).get();
      if (clientDoc.exists) {
        populated.client = { id: clientDoc.id, ...clientDoc.data() };
      }
    }

    if (fields.includes('user') && project.userId) {
      const userDoc = await this.db.collection(collections.users).doc(project.userId).get();
      if (userDoc.exists) {
        populated.user = { id: userDoc.id, ...userDoc.data() };
      }
    }

    return populated;
  }
}

export const Project = new ProjectModel();