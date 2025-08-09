import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Timestamp } from '@google-cloud/firestore';
import { initializeFirestore } from '../config/firestore-local.js';

// Firestore models - import after initialization
let FirestoreUser: any;
let FirestoreClient: any;
let FirestoreProject: any;
let FirestoreTimeEntry: any;

// MongoDB models
import User from '../models/User.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import TimeEntry from '../models/TimeEntry.js';

// Load environment variables
dotenv.config();

// Migration tracking
const migrationStats = {
  users: { total: 0, migrated: 0, failed: 0 },
  clients: { total: 0, migrated: 0, failed: 0 },
  projects: { total: 0, migrated: 0, failed: 0 },
  timeEntries: { total: 0, migrated: 0, failed: 0 }
};

// Map to store old ID to new ID mappings
const idMappings = {
  users: new Map<string, string>(),
  clients: new Map<string, string>(),
  projects: new Map<string, string>()
};

async function migrateUsers() {
  console.log('\n📝 Migrating Users...');
  
  try {
    const users = await User.find({}).select('+password');
    migrationStats.users.total = users.length;
    
    for (const user of users) {
      try {
        const firestoreUser = await FirestoreUser.create({
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed
          role: user.role as 'admin' | 'user',
          isActive: true, // Default to active
          avatar: user.avatar,
          skipHash: true // Skip re-hashing the password
        } as any);
        
        idMappings.users.set(user._id.toString(), firestoreUser.id!);
        migrationStats.users.migrated++;
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error);
        migrationStats.users.failed++;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  }
}

async function migrateClients() {
  console.log('\n📝 Migrating Clients...');
  
  try {
    const clients = await Client.find({});
    migrationStats.clients.total = clients.length;
    
    for (const client of clients) {
      try {
        const newUserId = idMappings.users.get(client.user.toString());
        if (!newUserId) {
          console.error(`❌ No mapping found for user ID: ${client.user}`);
          migrationStats.clients.failed++;
          continue;
        }
        
        const firestoreClient = await FirestoreClient.create({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          userId: newUserId
        });
        
        idMappings.clients.set(client._id.toString(), firestoreClient.id!);
        migrationStats.clients.migrated++;
        console.log(`✅ Migrated client: ${client.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate client ${client.name}:`, error);
        migrationStats.clients.failed++;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
  }
}

async function migrateProjects() {
  console.log('\n📝 Migrating Projects...');
  
  try {
    const projects = await Project.find({}).populate('members.user');
    migrationStats.projects.total = projects.length;
    
    for (const project of projects) {
      try {
        const newUserId = idMappings.users.get(project.user.toString());
        const newClientId = idMappings.clients.get(project.client.toString());
        
        if (!newUserId || !newClientId) {
          console.error(`❌ No mapping found for project ${project.name}`);
          migrationStats.projects.failed++;
          continue;
        }
        
        // Map members
        const members = project.members.map(member => {
          const memberId = idMappings.users.get(member.user._id.toString());
          return memberId ? { user: memberId, role: member.role } : null;
        }).filter(Boolean);
        
        // Map tasks
        const tasks = project.tasks.map((task: any) => ({
          id: task._id?.toString() || `task_${Date.now()}_${Math.random()}`,
          name: task.name,
          hourlyRate: task.hourlyRate,
          isBillable: task.isBillable !== undefined ? task.isBillable : true
        }));
        
        const firestoreProject = await FirestoreProject.create({
          name: project.name,
          description: project.description,
          clientId: newClientId,
          userId: newUserId,
          budget: project.budget,
          budgetType: project.budgetType as 'hourly' | 'fixed',
          hourlyRate: project.hourlyRate,
          status: project.status as 'active' | 'completed' | 'archived' | 'on-hold',
          tasks,
          members
        });
        
        idMappings.projects.set(project._id.toString(), firestoreProject.id!);
        migrationStats.projects.migrated++;
        console.log(`✅ Migrated project: ${project.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate project ${project.name}:`, error);
        migrationStats.projects.failed++;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
  }
}

async function migrateTimeEntries() {
  console.log('\n📝 Migrating Time Entries...');
  
  try {
    const timeEntries = await TimeEntry.find({});
    migrationStats.timeEntries.total = timeEntries.length;
    
    for (const entry of timeEntries) {
      try {
        const newUserId = idMappings.users.get(entry.user.toString());
        const newProjectId = idMappings.projects.get(entry.project.toString());
        
        if (!newUserId || !newProjectId) {
          console.error(`❌ No mapping found for time entry`);
          migrationStats.timeEntries.failed++;
          continue;
        }
        
        await FirestoreTimeEntry.create({
          userId: newUserId,
          projectId: newProjectId,
          taskId: entry.task, // Using task as taskId since it's a string in MongoDB
          date: entry.date.toISOString().split('T')[0],
          startTime: entry.startTime ? Timestamp.fromDate(new Date(entry.startTime)) : undefined,
          endTime: entry.endTime ? Timestamp.fromDate(new Date(entry.endTime)) : undefined,
          duration: entry.duration,
          notes: entry.notes,
          isBillable: entry.isBillable !== undefined ? entry.isBillable : true,
          isRunning: entry.isRunning || false
        });
        
        migrationStats.timeEntries.migrated++;
        console.log(`✅ Migrated time entry for date: ${entry.date.toISOString().split('T')[0]}`);
      } catch (error) {
        console.error(`❌ Failed to migrate time entry:`, error);
        migrationStats.timeEntries.failed++;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching time entries:', error);
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting migration from MongoDB to Firestore...\n');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Initialize Firestore
    initializeFirestore();
    console.log('✅ Initialized Firestore\n');
    
    // Import Firestore models after initialization
    const userModule = await import('../models/firestore/User.js');
    FirestoreUser = userModule.default;
    const clientModule = await import('../models/firestore/Client.js');
    FirestoreClient = clientModule.Client;
    const projectModule = await import('../models/firestore/Project.js');
    FirestoreProject = projectModule.Project;
    const timeEntryModule = await import('../models/firestore/TimeEntry.js');
    FirestoreTimeEntry = timeEntryModule.TimeEntry;
    
    // Run migrations in order (preserving relationships)
    await migrateUsers();
    await migrateClients();
    await migrateProjects();
    await migrateTimeEntries();
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('===================');
    Object.entries(migrationStats).forEach(([entity, stats]) => {
      console.log(`${entity}:`);
      console.log(`  Total: ${stats.total}`);
      console.log(`  Migrated: ${stats.migrated}`);
      console.log(`  Failed: ${stats.failed}`);
      console.log('');
    });
    
    console.log('✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();