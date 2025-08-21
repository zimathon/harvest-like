import { Firestore, Timestamp } from '@google-cloud/firestore';
import bcrypt from 'bcryptjs';
import { getFirestore } from '../../config/firestore-local.js';
import { IUser } from '../../types/firestore.js';
import { collections } from '../../config/firestore-local.js';

export interface UserCreateData extends Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> {
  password: string;
}

export interface UserMigrationData extends Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> {
  password: string;
  skipHash?: boolean;
}

export class UserModel {
  private db: any;
  private collection: any;
  
  constructor() {
    // Lazy initialization - db will be set on first use
  }

  private ensureDb() {
    if (!this.db) {
      this.db = getFirestore();
      this.collection = this.db.collection(collections.users);
      console.log('User model DB initialized with project:', this.db.projectId);
      console.log('DB settings:', this.db._settings);
    }
  }

  async create(userData: UserCreateData | UserMigrationData): Promise<IUser> {
    this.ensureDb();
    const now = Timestamp.now();
    const hashedPassword = 'skipHash' in userData && userData.skipHash 
      ? userData.password 
      : await bcrypt.hash(userData.password, 10);
    
    const user: any = {
      ...userData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(user);
    return {
      id: docRef.id,
      ...user
    };
  }

  async findById(id: string): Promise<IUser | null> {
    this.ensureDb();
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    } as IUser;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    this.ensureDb();
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as IUser;
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    this.ensureDb();
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }

    const updates = {
      ...updateData,
      updatedAt: Timestamp.now()
    };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as IUser;
  }

  async delete(id: string): Promise<boolean> {
    this.ensureDb();
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  async list(filters?: { role?: string; isActive?: boolean }): Promise<IUser[]> {
    this.ensureDb();
    let query = this.collection as any;
    
    if (filters?.role) {
      query = query.where('role', '==', filters.role);
    }
    
    if (filters?.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async findByIds(ids: string[]): Promise<IUser[]> {
    if (!ids.length) return [];
    this.ensureDb();
    
    // Firestore 'in' operator supports max 30 values at once
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const snapshot = await this.collection
          .where('__name__', 'in', chunk)
          .get();
        
        return snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as IUser));
      })
    );

    return results.flat();
  }

  async comparePassword(user: IUser, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, user.password);
  }
}

export default new UserModel();