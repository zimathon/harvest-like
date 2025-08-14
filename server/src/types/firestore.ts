import { Request } from 'express';

// User interface
export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

// Extend Express Request to include user for Firestore
export interface AuthRequestFirestore extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
  };
}