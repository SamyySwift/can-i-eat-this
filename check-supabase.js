// Check Supabase Connectivity
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '[Set]' : '[Not Set]');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

async function checkConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Check if auth service is accessible
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error connecting to Supabase Auth:', authError);
    } else {
      console.log('Supabase Auth connection successful');
    }

    // Try to list all tables
    const { data: tableList, error: tableError } = await supabase
      .rpc('get_schema_definition')
      .select('*');

    if (tableError) {
      console.log('Unable to get schema definition. This is often okay if you don\'t have rpc access.');
      console.log('Error:', tableError.message);
    } else {
      console.log('Tables list:', tableList);
    }

    // Try a direct select on users table
    console.log('Trying to select from users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('Error querying users table:', userError);
    } else {
      console.log('Users table query successful:', userData);
    }

  } catch (error) {
    console.error('Error checking Supabase connection:', error);
  }
}

checkConnection();