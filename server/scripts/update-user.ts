#!/usr/bin/env ts-node

import * as admin from 'firebase-admin';
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found at:', serviceAccountPath);
  console.error('Please ensure service-account-key.json exists in the server directory');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const program = new Command();

program
  .name('update-user')
  .description('Update Firebase user email and/or password')
  .version('1.0.0');

program
  .command('email')
  .description('Update user email address')
  .requiredOption('-c, --current <email>', 'Current email address')
  .requiredOption('-n, --new <email>', 'New email address')
  .action(async (options) => {
    try {
      // Find user by current email
      const user = await admin.auth().getUserByEmail(options.current);
      console.log(`✅ Found user: ${user.email} (UID: ${user.uid})`);
      
      // Update email
      await admin.auth().updateUser(user.uid, {
        email: options.new,
        emailVerified: true // Keep it verified since we're doing admin update
      });
      
      console.log(`✅ Successfully updated email from ${options.current} to ${options.new}`);
      
      // Also update in Firestore if needed
      const db = admin.firestore();
      const usersRef = db.collection('users');
      const userDoc = await usersRef.doc(user.uid).get();
      
      if (userDoc.exists) {
        await usersRef.doc(user.uid).update({
          email: options.new,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Firestore user document updated');
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error updating email:', error.message);
      process.exit(1);
    }
  });

program
  .command('password')
  .description('Update user password')
  .requiredOption('-e, --email <email>', 'User email address')
  .requiredOption('-p, --password <password>', 'New password (min 6 characters)')
  .action(async (options) => {
    try {
      // Validate password length
      if (options.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Find user by email
      const user = await admin.auth().getUserByEmail(options.email);
      console.log(`✅ Found user: ${user.email} (UID: ${user.uid})`);
      
      // Update password
      await admin.auth().updateUser(user.uid, {
        password: options.password
      });
      
      console.log(`✅ Successfully updated password for ${options.email}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error updating password:', error.message);
      process.exit(1);
    }
  });

program
  .command('both')
  .description('Update both email and password')
  .requiredOption('-c, --current <email>', 'Current email address')
  .requiredOption('-n, --new <email>', 'New email address')
  .requiredOption('-p, --password <password>', 'New password (min 6 characters)')
  .action(async (options) => {
    try {
      // Validate password length
      if (options.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Find user by current email
      const user = await admin.auth().getUserByEmail(options.current);
      console.log(`✅ Found user: ${user.email} (UID: ${user.uid})`);
      
      // Update both email and password
      await admin.auth().updateUser(user.uid, {
        email: options.new,
        emailVerified: true,
        password: options.password
      });
      
      console.log(`✅ Successfully updated:`);
      console.log(`   - Email: ${options.current} → ${options.new}`);
      console.log(`   - Password: Updated`);
      
      // Also update in Firestore if needed
      const db = admin.firestore();
      const usersRef = db.collection('users');
      const userDoc = await usersRef.doc(user.uid).get();
      
      if (userDoc.exists) {
        await usersRef.doc(user.uid).update({
          email: options.new,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Firestore user document updated');
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error updating user:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all users')
  .action(async () => {
    try {
      const listUsersResult = await admin.auth().listUsers(100);
      
      console.log('\n📋 Registered Users:\n');
      console.log('Email                          | UID                      | Created');
      console.log('-------------------------------|--------------------------|-------------------------');
      
      listUsersResult.users.forEach((userRecord) => {
        const email = userRecord.email || 'N/A';
        const uid = userRecord.uid;
        const created = userRecord.metadata.creationTime;
        console.log(`${email.padEnd(30)} | ${uid.padEnd(24)} | ${created}`);
      });
      
      console.log(`\nTotal users: ${listUsersResult.users.length}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error listing users:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}