import dotenv from 'dotenv';
import { initializeFirestore, getFirestore, collections } from '../src/config/firestore-local.js';
import User from '../src/models/firestore/User.js';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const checkAssociations = async () => {
  try {
    const db = getFirestore();
    
    // Get the user
    const user = await User.findByEmail('y.sasajima@siek.jp');
    if (!user) {
      console.error('❌ User y.sasajima@siek.jp not found');
      process.exit(1);
    }
    
    console.log(`\n👤 User: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    
    // Check clients
    console.log('\n📋 Clients associated with this user:');
    const clientsSnapshot = await db.collection(collections.clients)
      .where('userId', '==', user.id)
      .get();
    
    if (clientsSnapshot.empty) {
      console.log('   ❌ No clients found for this user');
    } else {
      clientsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   ✅ ${data.name} (ID: ${doc.id})`);
      });
    }
    
    // Check all clients to see what userId they have
    console.log('\n📋 All clients in the system:');
    const allClientsSnapshot = await db.collection(collections.clients).get();
    allClientsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (ID: ${doc.id}, userId: ${data.userId})`);
    });
    
    // Check projects
    console.log('\n📁 Projects:');
    const projectsSnapshot = await db.collection(collections.projects).get();
    
    if (projectsSnapshot.empty) {
      console.log('   No projects found');
    } else {
      projectsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name}`);
        console.log(`     Client ID: ${data.clientId}`);
        console.log(`     User ID: ${data.userId}`);
      });
    }
    
    // Check if there are projects for the ESI client
    const esiClient = clientsSnapshot.docs[0];
    if (esiClient) {
      console.log(`\n📁 Projects for ESI client (${esiClient.id}):`);
      const esiProjectsSnapshot = await db.collection(collections.projects)
        .where('clientId', '==', esiClient.id)
        .get();
      
      if (esiProjectsSnapshot.empty) {
        console.log('   No projects found for ESI client');
      } else {
        esiProjectsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.name} (User ID in project: ${data.userId})`);
        });
      }
    }
    
    // Check time entries
    console.log('\n⏱️ Sample Time Entries (first 5):');
    const entriesSnapshot = await db.collection(collections.timeEntries)
      .limit(5)
      .get();
    
    if (entriesSnapshot.empty) {
      console.log('   No time entries found');
    } else {
      entriesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - Project ID: ${data.projectId}, User ID: ${data.userId}`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAssociations();