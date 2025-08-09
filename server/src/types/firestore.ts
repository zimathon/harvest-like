import { Request } from 'express';

// Extend Express Request to include user for Firestore
export interface AuthRequestFirestore extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
  };
}