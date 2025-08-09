import { getFirestore, collections } from '../../config/firestore-local.js';
import { Timestamp } from '@google-cloud/firestore';

export interface IClient {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  userId: string;
  user?: any; // Will be populated when needed
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class ClientModel {
  private db = getFirestore();
  private collection = this.db.collection(collections.clients);

  async create(clientData: Omit<IClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<IClient> {
    const now = Timestamp.now();
    
    const client: Omit<IClient, 'id'> = {
      ...clientData,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(client);
    return {
      id: docRef.id,
      ...client
    };
  }

  async findById(id: string): Promise<IClient | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    } as IClient;
  }

  async findByUser(userId: string): Promise<IClient[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IClient));
  }

  async findAll(): Promise<IClient[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IClient));
  }

  async update(id: string, updateData: Partial<IClient>): Promise<IClient | null> {
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
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}

export const Client = new ClientModel();