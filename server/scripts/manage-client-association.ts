import dotenv from 'dotenv';
import { initializeFirestore, getFirestore, collections } from '../src/config/firestore-local.js';
import { Client } from '../src/models/firestore/Client.js';
import User from '../src/models/firestore/User.js';
import { Command } from 'commander';

dotenv.config();

// Initialize Firestore
initializeFirestore();

const program = new Command();

program
  .name('manage-client-association')
  .description('Manage client associations for users')
  .version('1.0.0');

program
  .command('list-clients')
  .description('List all clients in the system')
  .action(async () => {
    try {
      const clients = await Client.findAll();
      
      console.log('\n📋 All Clients:\n');
      console.log('ID                     | Name                | Email                     | User ID');
      console.log('-----------------------|---------------------|---------------------------|------------------------');
      
      for (const client of clients) {
        const id = (client.id || '').padEnd(22);
        const name = (client.name || 'N/A').padEnd(19);
        const email = (client.email || 'N/A').padEnd(26);
        const userId = client.userId || 'N/A';
        console.log(`${id} | ${name} | ${email} | ${userId}`);
      }
      
      console.log(`\nTotal clients: ${clients.length}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error listing clients:', error.message);
      process.exit(1);
    }
  });

program
  .command('find-esi')
  .description('Find ESI client')
  .action(async () => {
    try {
      const clients = await Client.findAll();
      const esiClients = clients.filter(c => 
        c.name?.toLowerCase().includes('esi') || 
        c.name?.toLowerCase().includes('イーエスアイ')
      );
      
      if (esiClients.length === 0) {
        console.log('❌ No ESI client found');
        console.log('\nAll existing clients:');
        clients.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
      } else {
        console.log('✅ Found ESI client(s):');
        esiClients.forEach(c => {
          console.log(`\n  Name: ${c.name}`);
          console.log(`  ID: ${c.id}`);
          console.log(`  Email: ${c.email || 'N/A'}`);
          console.log(`  User ID: ${c.userId}`);
        });
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error finding ESI client:', error.message);
      process.exit(1);
    }
  });

program
  .command('associate')
  .description('Associate user with client')
  .requiredOption('-e, --email <email>', 'User email')
  .requiredOption('-c, --client <name>', 'Client name (or ID)')
  .action(async (options) => {
    try {
      // Find user
      const user = await User.findByEmail(options.email);
      if (!user) {
        throw new Error(`User with email ${options.email} not found`);
      }
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      
      // Find client
      const clients = await Client.findAll();
      let targetClient = clients.find(c => 
        c.id === options.client ||
        c.name?.toLowerCase() === options.client.toLowerCase() ||
        c.name?.toLowerCase().includes(options.client.toLowerCase())
      );
      
      if (!targetClient) {
        console.log('\n❌ Client not found. Available clients:');
        clients.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
        process.exit(1);
        return;
      }
      
      console.log(`✅ Found client: ${targetClient.name} (ID: ${targetClient.id})`);
      
      // Update client with new userId
      await Client.update(targetClient.id!, { userId: user.id });
      
      console.log(`\n✅ Successfully associated user ${user.email} with client ${targetClient.name}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error associating user with client:', error.message);
      process.exit(1);
    }
  });

program
  .command('create-esi')
  .description('Create ESI client for a user')
  .requiredOption('-e, --email <email>', 'User email to associate with')
  .option('-n, --name <name>', 'Client name', 'ESI Corporation')
  .option('--client-email <email>', 'Client email')
  .option('--phone <phone>', 'Client phone')
  .option('--address <address>', 'Client address')
  .action(async (options) => {
    try {
      // Find user
      const user = await User.findByEmail(options.email);
      if (!user) {
        throw new Error(`User with email ${options.email} not found`);
      }
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      
      // Create client
      const client = await Client.create({
        name: options.name,
        email: options.clientEmail,
        phone: options.phone,
        address: options.address,
        userId: user.id!
      });
      
      console.log(`\n✅ Successfully created client:`);
      console.log(`  Name: ${client.name}`);
      console.log(`  ID: ${client.id}`);
      console.log(`  Associated with: ${user.email}`);
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error creating client:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);