/**
 * Firestore configuration for production environment on GCP
 */

import { Firestore } from '@google-cloud/firestore';
import * as admin from 'firebase-admin';

let db: Firestore;

/**
 * Initialize Firestore for production
 * Uses Application Default Credentials in GCP environment
 */
export const initializeFirestore = (): Firestore => {
  if (db) {
    return db;
  }

  try {
    // In GCP environment (Cloud Run), use Application Default Credentials
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT) {
      // Initialize without credentials - will use ADC
      admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      
      db = admin.firestore();
      
      // Production optimizations
      db.settings({
        // Use preferRest for better performance in Cloud Run
        preferRest: true,
        // Increase cache size for better performance
        cacheSizeBytes: 50 * 1024 * 1024, // 50MB
      });
      
      console.log('✅ Firestore initialized for production');
    } else {
      // Fallback for local development with service account
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : require('../../firebase-service-account.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      db = admin.firestore();
      console.log('✅ Firestore initialized with service account');
    }
    
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    throw error;
  }
};

/**
 * Get Firestore instance
 */
export const getFirestore = (): Firestore => {
  if (!db) {
    db = initializeFirestore();
  }
  return db;
};

/**
 * Health check for Firestore connection
 */
export const checkFirestoreHealth = async (): Promise<boolean> => {
  try {
    const testDoc = await getFirestore()
      .collection('_health')
      .doc('check')
      .get();
    
    // Write a test document to verify write permissions
    await getFirestore()
      .collection('_health')
      .doc('check')
      .set({
        timestamp: new Date().toISOString(),
        status: 'healthy',
      });
    
    return true;
  } catch (error) {
    console.error('Firestore health check failed:', error);
    return false;
  }
};

/**
 * Batch write helper with automatic chunking
 */
export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: FirebaseFirestore.DocumentReference;
    data?: any;
  }>
): Promise<void> => {
  const db = getFirestore();
  const batchSize = 500; // Firestore batch limit
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = db.batch();
    const chunk = operations.slice(i, i + batchSize);
    
    chunk.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    });
    
    await batch.commit();
  }
};

/**
 * Transaction helper with retry logic
 */
export const runTransaction = async <T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  maxAttempts = 5
): Promise<T> => {
  const db = getFirestore();
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await db.runTransaction(updateFunction);
    } catch (error: any) {
      attempts++;
      
      if (error.code === 'aborted' && attempts < maxAttempts) {
        // Retry on transaction conflict
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Transaction failed after maximum attempts');
};

/**
 * Create composite indexes programmatically (for development)
 * Note: In production, indexes should be created via Terraform or Firebase CLI
 */
export const ensureIndexes = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Index creation should be done via Terraform in production');
    return;
  }
  
  // Indexes are created via Terraform in production
  console.log('✅ Indexes managed by Terraform');
};

export default getFirestore;