import { getFirestore } from './src/config/firestore-local.js';

async function checkUsers() {
  const db = getFirestore();
  const users = await db.collection('users').where('email', '==', 'admin@example.com').get();
  console.log('Found users:', users.docs.length);
  users.docs.forEach(doc => {
    const data = doc.data();
    console.log('User:', { id: doc.id, email: data.email, role: data.role });
  });
}

checkUsers().catch(console.error);