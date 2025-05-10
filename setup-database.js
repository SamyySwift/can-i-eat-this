// Setup database script
// Run with: node setup-database.js
// This script will create the necessary tables in Supabase

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Setting up database tables in Supabase...');
  
  // Create users table
  console.log('Creating users table...');
  const { error: usersError } = await supabase.from('users').select('count');
  
  if (usersError && usersError.code === '42P01') { // Table doesn't exist
    const { error: createUsersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (createUsersError) {
      console.error('Error creating users table:', createUsersError);
    } else {
      console.log('Users table created successfully');
    }
  } else if (!usersError) {
    console.log('Users table already exists');
  } else {
    console.error('Error checking users table:', usersError);
  }
  
  // Create dietary_profiles table
  console.log('Creating dietary_profiles table...');
  const { error: profilesError } = await supabase.from('dietary_profiles').select('count');
  
  if (profilesError && profilesError.code === '42P01') { // Table doesn't exist
    const { error: createProfilesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS dietary_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          allergies JSONB DEFAULT '[]'::jsonb,
          dietary_preferences JSONB DEFAULT '[]'::jsonb,
          health_restrictions JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (createProfilesError) {
      console.error('Error creating dietary_profiles table:', createProfilesError);
    } else {
      console.log('Dietary profiles table created successfully');
    }
  } else if (!profilesError) {
    console.log('Dietary profiles table already exists');
  } else {
    console.error('Error checking dietary_profiles table:', profilesError);
  }
  
  // Create food_scans table
  console.log('Creating food_scans table...');
  const { error: scansError } = await supabase.from('food_scans').select('count');
  
  if (scansError && scansError.code === '42P01') { // Table doesn't exist
    const { error: createScansError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (createScansError) {
      console.error('Error creating food_scans table:', createScansError);
    } else {
      console.log('Food scans table created successfully');
    }
  } else if (!scansError) {
    console.log('Food scans table already exists');
  } else {
    console.error('Error checking food_scans table:', scansError);
  }
  
  // Create scan_limits table
  console.log('Creating scan_limits table...');
  const { error: limitsError } = await supabase.from('scan_limits').select('count');
  
  if (limitsError && limitsError.code === '42P01') { // Table doesn't exist
    const { error: createLimitsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS scan_limits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
          scans_used INTEGER NOT NULL DEFAULT 0,
          max_scans INTEGER NOT NULL DEFAULT 10,
          reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month')
        );
      `
    });
    
    if (createLimitsError) {
      console.error('Error creating scan_limits table:', createLimitsError);
    } else {
      console.log('Scan limits table created successfully');
    }
  } else if (!limitsError) {
    console.log('Scan limits table already exists');
  } else {
    console.error('Error checking scan_limits table:', limitsError);
  }
  
  console.log('Database setup complete!');
}

main()
  .catch(error => {
    console.error('Error setting up database:', error);
    process.exit(1);
  });