/**
 * Auto-migration system - Runs migrations on server startup
 * This ensures the database schema is up to date before the server starts
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Check if block_assignments table exists
 */
async function checkBlockAssignmentsTable() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'block_assignments'
      );
    `);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

/**
 * Create block_assignments table if it doesn't exist
 */
async function createBlockAssignmentsTable() {
  const client = await pool.connect();
  try {
    console.log('📝 Creating block_assignments table...');

    await client.query('BEGIN');

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS block_assignments (
        id SERIAL PRIMARY KEY,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        assigned_to_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
        due_date TIMESTAMP,
        notes TEXT,
        assigned_at TIMESTAMP DEFAULT NOW(),
        CHECK (group_id IS NOT NULL OR assigned_to_user IS NOT NULL),
        CHECK (NOT (group_id IS NOT NULL AND assigned_to_user IS NOT NULL))
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_block_assignments_block ON block_assignments(block_id);
      CREATE INDEX IF NOT EXISTS idx_block_assignments_assigned_by ON block_assignments(assigned_by);
      CREATE INDEX IF NOT EXISTS idx_block_assignments_group ON block_assignments(group_id) WHERE group_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_block_assignments_user ON block_assignments(assigned_to_user) WHERE assigned_to_user IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_block_assignments_due_date ON block_assignments(due_date) WHERE due_date IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_block_assignments_assigned_by_date ON block_assignments(assigned_by, assigned_at DESC);
    `);

    await client.query('COMMIT');

    console.log('✅ block_assignments table created successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating block_assignments table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('🔄 Checking database schema...');

    // Check and create block_assignments table if needed
    const tableExists = await checkBlockAssignmentsTable();

    if (!tableExists) {
      console.log('⚠️  block_assignments table not found');
      await createBlockAssignmentsTable();
    } else {
      console.log('✅ block_assignments table already exists');
    }

    console.log('✨ Database schema is up to date');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    // Don't end the pool here - it will be used by the server
  }
}

module.exports = { runMigrations };
