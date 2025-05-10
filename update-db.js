import 'dotenv/config'; 
import pkg from 'pg';
const { Pool } = pkg;

// Connect directly to the database using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
  try {
    console.log('Attempting to update food_scans table schema...');
    
    // Execute Raw SQL to add the new columns
    await pool.query(`
      ALTER TABLE food_scans 
      ADD COLUMN IF NOT EXISTS unsafe_reasons JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    console.log('Schema updated successfully');
    
    // Verify the columns exist
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'food_scans';
    `);
    
    console.log('Food scans columns:', result.rows.map(row => row.column_name));
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

updateSchema();