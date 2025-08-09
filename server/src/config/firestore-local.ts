import { Firestore } from '@google-cloud/firestore';

let db: Firestore;

export const initializeFirestore = () => {
  if (!db) {
    // ローカル開発環境の設定
    if (process.env.NODE_ENV === 'development') {
      db = new Firestore({
        projectId: 'harvest-local',
        host: 'localhost:8090',
        ssl: false,
        credentials: {
          client_email: 'test@example.com',
          private_key: 'test-key'
        }
      });
    } else {
      // 本番環境
      db = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
    }
  }
  return db;
};

export const getFirestore = () => {
  if (!db) {
    return initializeFirestore();
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

// Helper functions
export const docToObject = (doc: any) => {
  if (!doc.exists) {
    return null;
  }
  return {
    id: doc.id,
    ...doc.data()
  };
};

export const docsToArray = (snapshot: any) => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
};