import { Firestore } from '@google-cloud/firestore';

let db: Firestore;

export const initializeFirestore = () => {
  // Always reinitialize to ensure we get the correct project ID
  // Emulatorを使用するかどうかの判定
  const useEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true';
  
  // Clear any environment variables that might trigger emulator mode
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  
  if (useEmulator) {
    // Emulator使用（テスト環境）
    console.log('🔧 Using Firestore Emulator at localhost:8090');
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
    // 本番Firestore使用（ローカル開発でも本番でも）
    const projectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'harvest-a82c0';
    console.log('🌐 Using Production Firestore:', projectId);
    
    // Explicitly set to production mode
    db = new Firestore({
      projectId: projectId,
      // No host/port settings to ensure production mode
    });
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