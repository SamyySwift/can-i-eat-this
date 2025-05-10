import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { log } from './vite';

// Environment setup
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

log(`Initializing database connection`, 'db');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }, // This allows connecting to Supabase with SSL
});

// Create Drizzle instance with the pool
export const db = drizzle(pool);

// Test the connection
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    log('Database connection successful', 'db');
  } catch (error) {
    log(`Database connection error: ${error}`, 'db');
    console.error('Failed to connect to the database', error);
  }
}

testConnection();