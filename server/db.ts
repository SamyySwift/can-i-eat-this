import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { log } from './vite';

// Environment setup
const databaseUrl = process.env.DATABASE_URL;
let db: ReturnType<typeof drizzle> | null = null;

// Only initialize if DATABASE_URL is available
if (databaseUrl) {
  try {
    log('Initializing database connection with Supabase', 'db');
    
    // Create a PostgreSQL client
    const client = postgres(databaseUrl, { ssl: 'require' });
    
    // Create Drizzle ORM instance
    db = drizzle(client);
    
    log('Database connection initialized successfully', 'db');
  } catch (error) {
    log(`Failed to initialize database connection: ${error}`, 'db');
    console.error('Database connection error:', error);
  }
} else {
  log('No DATABASE_URL provided, database features will be unavailable', 'db');
}

export { db };