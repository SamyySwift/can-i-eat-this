// Push schema to database
// Run with: node push-schema.js

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  console.log('Pushing schema to database...');
  
  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  // Push schema
  try {
    // We don't actually need to import the schema since we're using raw SQL
    await db.execute('SET client_min_messages TO warning;');
    
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS dietary_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        allergies JSONB DEFAULT '[]'::jsonb,
        dietary_preferences JSONB DEFAULT '[]'::jsonb,
        health_restrictions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS food_scans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        food_name TEXT NOT NULL,
        image_url TEXT,
        ingredients JSONB DEFAULT '[]'::jsonb,
        is_safe BOOLEAN,
        safety_reason TEXT,
        scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS scan_limits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        scans_used INTEGER NOT NULL DEFAULT 0,
        max_scans INTEGER NOT NULL DEFAULT 10,
        reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month')
      );
    `);
    
    console.log('Schema pushed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();