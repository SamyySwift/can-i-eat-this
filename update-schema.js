import 'dotenv/config'; 
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSchema() {
  try {
    console.log('Attempting to update food_scans table schema...');
    
    // Execute Raw SQL to add the new columns
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE food_scans 
        ADD COLUMN IF NOT EXISTS unsafe_reasons JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS description TEXT;
      `
    });

    if (error) {
      console.error('Error updating schema:', error);
      return;
    }

    console.log('Schema updated successfully');
    
    // Verify the columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('food_scans')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return;
    }

    console.log('Food scans columns:', Object.keys(columns[0] || {}));
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateSchema();