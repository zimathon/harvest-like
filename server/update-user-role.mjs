import { Firestore } from '@google-cloud/firestore';

const projectId = 'harvest-a82c0';
const db = new Firestore({ projectId });

async function updateUserRole() {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', 'y.sasajima@siek.jp').get();
    
    if (snapshot.empty) {
      console.log('User not found with email: y.sasajima@siek.jp');
      return;
    }
    
    // Update role to admin
    const batch = db.batch();
    snapshot.forEach(doc => {
      console.log(`Found user: ${doc.id}, current data:`, doc.data());
      batch.update(doc.ref, { role: 'admin' });
    });
    
    await batch.commit();
    console.log('✅ Successfully updated user role to admin for y.sasajima@siek.jp');
    
    // Verify the update
    const updatedSnapshot = await usersRef.where('email', '==', 'y.sasajima@siek.jp').get();
    updatedSnapshot.forEach(doc => {
      console.log('Updated user data:', doc.data());
    });
    
  } catch (error) {
    console.error('Error updating user role:', error);
  }
  
  process.exit(0);
}

updateUserRole();