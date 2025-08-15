import dotenv from 'dotenv';
import { initializeFirestore } from '../src/config/firestore-local.js';
import User from '../src/models/firestore/User.js';
import { Command } from 'commander';
import bcrypt from 'bcryptjs';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const program = new Command();

program
  .name('update-user-local')
  .description('Update user email and/or password in local Firestore')
  .version('1.0.0');

program
  .command('list')
  .description('List all users')
  .action(async () => {
    try {
      const users = await User.list();
      
      console.log('\n📋 Registered Users:\n');
      console.log('Email                          | Name                     | Role     | Active');
      console.log('-------------------------------|--------------------------|----------|-------');
      
      users.forEach((user) => {
        const email = user.email.padEnd(30);
        const name = (user.name || 'N/A').padEnd(24);
        const role = user.role.padEnd(8);
        const active = user.isActive ? '✅' : '❌';
        console.log(`${email} | ${name} | ${role} | ${active}`);
      });
      
      console.log(`\nTotal users: ${users.length}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error listing users:', error.message);
      process.exit(1);
    }
  });

program
  .command('email')
  .description('Update user email address')
  .requiredOption('-c, --current <email>', 'Current email address')
  .requiredOption('-n, --new <email>', 'New email address')
  .action(async (options) => {
    try {
      // Find user by current email
      const user = await User.findByEmail(options.current);
      
      if (!user) {
        throw new Error(`User with email ${options.current} not found`);
      }
      
      console.log(`✅ Found user: ${user.email} (Name: ${user.name})`);
      
      // Check if new email already exists
      const existingUser = await User.findByEmail(options.new);
      if (existingUser) {
        throw new Error(`Email ${options.new} is already in use`);
      }
      
      // Update email
      await User.update(user.id!, { email: options.new });
      
      console.log(`✅ Successfully updated email from ${options.current} to ${options.new}`);
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
      const user = await User.findByEmail(options.email);
      
      if (!user) {
        throw new Error(`User with email ${options.email} not found`);
      }
      
      console.log(`✅ Found user: ${user.email} (Name: ${user.name})`);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(options.password, 10);
      
      // Update password
      await User.update(user.id!, { password: hashedPassword });
      
      console.log(`✅ Successfully updated password for ${options.email}`);
      console.log(`   New password: ${options.password}`);
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
      const user = await User.findByEmail(options.current);
      
      if (!user) {
        throw new Error(`User with email ${options.current} not found`);
      }
      
      console.log(`✅ Found user: ${user.email} (Name: ${user.name})`);
      
      // Check if new email already exists
      if (options.current !== options.new) {
        const existingUser = await User.findByEmail(options.new);
        if (existingUser) {
          throw new Error(`Email ${options.new} is already in use`);
        }
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(options.password, 10);
      
      // Update both email and password
      await User.update(user.id!, {
        email: options.new,
        password: hashedPassword
      });
      
      console.log(`✅ Successfully updated:`);
      console.log(`   - Email: ${options.current} → ${options.new}`);
      console.log(`   - Password: Updated to: ${options.password}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error updating user:', error.message);
      process.exit(1);
    }
  });

program
  .command('create')
  .description('Create a new user')
  .requiredOption('-e, --email <email>', 'Email address')
  .requiredOption('-p, --password <password>', 'Password (min 6 characters)')
  .requiredOption('-n, --name <name>', 'User name')
  .option('-r, --role <role>', 'User role (admin/member)', 'member')
  .action(async (options) => {
    try {
      // Validate password length
      if (options.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Check if email already exists
      const existingUser = await User.findByEmail(options.email);
      if (existingUser) {
        throw new Error(`Email ${options.email} is already in use`);
      }
      
      // Create new user
      const newUser = await User.create({
        email: options.email,
        password: options.password, // Will be hashed automatically
        name: options.name,
        role: options.role as 'admin' | 'member',
        isActive: true,
        avatar: ''
      });
      
      console.log(`✅ Successfully created user:`);
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - Name: ${newUser.name}`);
      console.log(`   - Role: ${newUser.role}`);
      console.log(`   - Password: ${options.password}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}