import { Firestore } from '@google-cloud/firestore';

let db: Firestore;

export const initializeFirestore = () => {
  if (!db) {
    // Emulatorを使用するかどうかの判定
    const useEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true' || 
                       process.env.FIRESTORE_EMULATOR_HOST;
    
    if (useEmulator) {
      // Emulator使用（テスト環境）
      console.log('🔧 Using Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8090');
      db = new Firestore({
        projectId: 'harvest-local',
        host: process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8090',
        ssl: false,
        credentials: {
          client_email: 'test@example.com',
          private_key: 'test-key'
        }
      });
    } else {
      // 本番Firestore使用（ローカル開発でも本番でも）
      const projectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'harvest-a82c0';
      console.log('🌐 Using Production Firestore:', projectId);
      db = new Firestore({
        projectId: projectId,
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