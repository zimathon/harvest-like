import { Firestore } from '@google-cloud/firestore';

let db: Firestore;

export const initializeFirestore = () => {
  if (!db) {
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }
  return db;
};

export const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

// Collections
export const collections = {
  users: 'users',
  projects: 'projects',
  clients: 'clients',
  timeEntries: 'timeEntries',
  expenses: 'expenses',
  invoices: 'invoices'
};

// Helper function to convert Firestore document to include id
export const docToObject = (doc: any) => {
  return {
    id: doc.id,
    ...doc.data()
  };
};