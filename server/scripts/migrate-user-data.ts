import dotenv from 'dotenv';
import { initializeFirestore, getFirestore, collections } from '../src/config/firestore-local.js';
import User from '../src/models/firestore/User.js';
import { Command } from 'commander';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const program = new Command();

program
  .name('migrate-user-data')
  .description('Migrate projects and time entries to new user')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate all data from old user to new user')
  .requiredOption('-o, --old <userId>', 'Old user ID')
  .requiredOption('-n, --new <email>', 'New user email')
  .option('--dry-run', 'Show what would be migrated without actually doing it')
  .action(async (options) => {
    try {
      const db = getFirestore();
      
      // Find new user
      const newUser = await User.findByEmail(options.new);
      if (!newUser) {
        throw new Error(`User with email ${options.new} not found`);
      }
      
      console.log(`\n📋 Migration Plan:`);
      console.log(`   From User ID: ${options.old}`);
      console.log(`   To User: ${newUser.email} (ID: ${newUser.id})`);
      
      if (options.dryRun) {
        console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
      }
      
      // Migrate projects
      console.log('\n📁 Migrating Projects:');
      const projectsSnapshot = await db.collection(collections.projects)
        .where('userId', '==', options.old)
        .get();
      
      if (projectsSnapshot.empty) {
        console.log('   No projects to migrate');
      } else {
        for (const doc of projectsSnapshot.docs) {
          const data = doc.data();
          console.log(`   - ${data.name} (ID: ${doc.id})`);
          
          if (!options.dryRun) {
            await doc.ref.update({ userId: newUser.id });
          }
        }
        console.log(`   ✅ ${projectsSnapshot.size} projects ${options.dryRun ? 'would be' : ''} migrated`);
      }
      
      // Migrate time entries
      console.log('\n⏱️ Migrating Time Entries:');
      const entriesSnapshot = await db.collection(collections.timeEntries)
        .where('userId', '==', options.old)
        .get();
      
      if (entriesSnapshot.empty) {
        console.log('   No time entries to migrate');
      } else {
        console.log(`   Found ${entriesSnapshot.size} time entries`);
        
        if (!options.dryRun) {
          // Update in batches to avoid timeout
          const batch = db.batch();
          let count = 0;
          
          for (const doc of entriesSnapshot.docs) {
            batch.update(doc.ref, { userId: newUser.id });
            count++;
            
            // Commit every 500 documents
            if (count % 500 === 0) {
              await batch.commit();
              console.log(`   Updated ${count} entries...`);
            }
          }
          
          // Commit remaining
          if (count % 500 !== 0) {
            await batch.commit();
          }
        }
        
        console.log(`   ✅ ${entriesSnapshot.size} time entries ${options.dryRun ? 'would be' : ''} migrated`);
      }
      
      // Migrate expenses if they exist
      console.log('\n💰 Checking for Expenses:');
      try {
        const expensesSnapshot = await db.collection(collections.expenses)
          .where('userId', '==', options.old)
          .get();
        
        if (expensesSnapshot.empty) {
          console.log('   No expenses to migrate');
        } else {
          console.log(`   Found ${expensesSnapshot.size} expenses`);
          
          if (!options.dryRun) {
            for (const doc of expensesSnapshot.docs) {
              await doc.ref.update({ userId: newUser.id });
            }
          }
          
          console.log(`   ✅ ${expensesSnapshot.size} expenses ${options.dryRun ? 'would be' : ''} migrated`);
        }
      } catch (error) {
        console.log('   Expenses collection not found or no expenses to migrate');
      }
      
      if (options.dryRun) {
        console.log('\n✅ Dry run complete. Use without --dry-run to actually migrate.');
      } else {
        console.log('\n✅ Migration complete!');
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check what data exists for a user ID')
  .requiredOption('-u, --user <userId>', 'User ID to check')
  .action(async (options) => {
    try {
      const db = getFirestore();
      
      console.log(`\n📋 Data for User ID: ${options.user}`);
      
      // Check projects
      const projectsSnapshot = await db.collection(collections.projects)
        .where('userId', '==', options.user)
        .get();
      console.log(`\n📁 Projects: ${projectsSnapshot.size}`);
      projectsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (ID: ${doc.id})`);
      });
      
      // Check time entries
      const entriesSnapshot = await db.collection(collections.timeEntries)
        .where('userId', '==', options.user)
        .get();
      console.log(`\n⏱️ Time Entries: ${entriesSnapshot.size}`);
      
      // Check expenses
      try {
        const expensesSnapshot = await db.collection(collections.expenses)
          .where('userId', '==', options.user)
          .get();
        console.log(`\n💰 Expenses: ${expensesSnapshot.size}`);
      } catch {
        console.log('\n💰 Expenses: N/A');
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);