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
 * Check if communication tables exist
 */
async function checkCommunicationTables() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tickets'
      );
    `);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

/**
 * Check if escalate_tickets function exists
 */
async function checkEscalateTicketsFunction() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'escalate_tickets'
      );
    `);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

/**
 * Check if blocks table has metadata columns
 */
async function checkBlockMetadataColumns() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'blocks' AND column_name = 'tipo_id'
        ) as has_tipo_id,
        EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'blocks' AND column_name = 'nivel_id'
        ) as has_nivel_id,
        EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'blocks' AND column_name = 'estado_id'
        ) as has_estado_id
    `);

    const row = result.rows[0];
    return row.has_tipo_id && row.has_nivel_id && row.has_estado_id;
  } finally {
    client.release();
  }
}

/**
 * Check if direct messaging tables and functions exist
 */
async function checkDirectMessagingTables() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'conversations'
        ) as has_conversations,
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'direct_messages'
        ) as has_direct_messages,
        EXISTS (
          SELECT FROM pg_proc
          WHERE proname = 'cleanup_expired_typing_status'
        ) as has_cleanup_function
    `);

    const row = result.rows[0];
    return row.has_conversations && row.has_direct_messages && row.has_cleanup_function;
  } finally {
    client.release();
  }
}

/**
 * Check if users table has avatar_url column
 */
async function checkUsersAvatarColumn() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'avatar_url'
      ) as has_avatar_url
    `);
    return result.rows[0].has_avatar_url;
  } finally {
    client.release();
  }
}

/**
 * Add avatar_url column to users table
 */
async function addUsersAvatarColumn() {
  const client = await pool.connect();
  try {
    console.log('📝 Adding avatar_url column to users table...');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
    `);

    console.log('✅ avatar_url column added successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding avatar_url column:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if teachers panel tables exist
 */
async function checkTeachersPanelTables() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'oposiciones'
        ) as has_oposiciones,
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'class_enrollments'
        ) as has_class_enrollments
    `);

    const row = result.rows[0];
    return row.has_oposiciones && row.has_class_enrollments;
  } finally {
    client.release();
  }
}

/**
 * Apply teachers panel schema
 */
async function applyTeachersPanelSchema() {
  const client = await pool.connect();
  try {
    console.log('📝 Applying teachers panel schema...');

    const schemaPath = path.join(__dirname, 'database-schema-teachers-panel.sql');

    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️  Teachers panel schema file not found, skipping...');
      return false;
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSQL);

    console.log('✅ Teachers panel schema applied successfully');
    return true;
  } catch (error) {
    // Ignore "already exists" errors
    if (error.message.includes('already exists') ||
        error.message.includes('ya existe') ||
        error.code === '42P07') {
      console.log('⚠️  Some teachers panel tables already exist (OK)');
      return true;
    }

    console.error('❌ Error applying teachers panel schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Apply direct messaging migration
 */
async function applyDirectMessagingMigration() {
  const client = await pool.connect();
  try {
    console.log('📝 Applying direct messaging system migration...');

    const migrationPath = path.join(__dirname, 'migrations', '001-add-direct-messaging.sql');

    if (!fs.existsSync(migrationPath)) {
      console.warn('⚠️  Direct messaging migration file not found, skipping...');
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Direct messaging system migration applied successfully');
    return true;
  } catch (error) {
    // Ignore "already exists" errors
    if (error.message.includes('already exists') ||
        error.message.includes('ya existe') ||
        error.code === '42P07') {
      console.log('⚠️  Some direct messaging tables already exist (OK)');
      return true;
    }

    console.error('❌ Error applying direct messaging migration:', error);
    throw error;
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
 * Apply communication schema
 */
async function applyCommunicationSchema() {
  const client = await pool.connect();
  try {
    console.log('📝 Applying communication system schema...');

    const schemaPath = path.join(__dirname, '..', 'database-schema-communication.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');

    console.log('✅ Communication system schema applied successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');

    // Ignore "already exists" errors
    if (error.message.includes('already exists') ||
        error.message.includes('ya existe') ||
        error.code === '42P07') {
      console.log('⚠️  Some communication tables/functions already exist (OK)');
      return true;
    }

    console.error('❌ Error applying communication schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add metadata columns to blocks table
 */
async function addBlockMetadataColumns() {
  const client = await pool.connect();
  try {
    console.log('📝 Adding metadata columns to blocks table...');

    const migrationPath = path.join(__dirname, 'migrations', 'add-block-metadata-columns.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');

    console.log('✅ Block metadata columns added successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');

    // Ignore "already exists" errors
    if (error.message.includes('already exists') ||
        error.message.includes('ya existe') ||
        error.code === '42P07' ||
        error.code === '42701') {
      console.log('⚠️  Metadata columns already exist (OK)');
      return true;
    }

    console.error('❌ Error adding block metadata columns:', error);
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

    // Check communication tables and function
    const commTablesExist = await checkCommunicationTables();
    const escalateFunctionExists = await checkEscalateTicketsFunction();

    if (!commTablesExist || !escalateFunctionExists) {
      console.log('⚠️  Communication system not fully configured');
      if (!commTablesExist) {
        console.log('   - tickets table not found');
      }
      if (!escalateFunctionExists) {
        console.log('   - escalate_tickets() function not found');
      }
      await applyCommunicationSchema();
    } else {
      console.log('✅ Communication system already configured');
    }

    // Check and add avatar_url column to users table if needed
    const avatarColumnExists = await checkUsersAvatarColumn();

    if (!avatarColumnExists) {
      console.log('⚠️  users.avatar_url column not found');
      await addUsersAvatarColumn();
    } else {
      console.log('✅ users.avatar_url column already exists');
    }

    // Check and add block metadata columns if needed
    const metadataColumnsExist = await checkBlockMetadataColumns();

    if (!metadataColumnsExist) {
      console.log('⚠️  Block metadata columns not found');
      console.log('   - Adding tipo_id, nivel_id, estado_id columns...');
      await addBlockMetadataColumns();
    } else {
      console.log('✅ Block metadata columns already exist');
    }

    // Check and apply teachers panel schema if needed
    const teachersPanelTablesExist = await checkTeachersPanelTables();

    if (!teachersPanelTablesExist) {
      console.log('⚠️  Teachers panel tables not found');
      console.log('   - oposiciones table not found');
      console.log('   - class_enrollments table not found');
      await applyTeachersPanelSchema();
    } else {
      console.log('✅ Teachers panel already configured');
    }

    // Check and apply direct messaging migration if needed
    const directMessagingTablesExist = await checkDirectMessagingTables();

    if (!directMessagingTablesExist) {
      console.log('⚠️  Direct messaging system not fully configured');
      console.log('   - Checking for missing tables or functions...');
      await applyDirectMessagingMigration();
    } else {
      console.log('✅ Direct messaging system already configured');
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
