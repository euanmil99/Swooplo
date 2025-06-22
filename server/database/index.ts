import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export { schema };

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await client.end();
});

process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await client.end();
}); 