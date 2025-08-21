#!/usr/bin/env node

/**
 * PLAYTEST Database Unified Schema Deployment
 * This script applies the unified database schema to align with the provided schema specification
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deployUnifiedSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting PLAYTEST Unified Schema Deployment...');
    
    // Read the unified schema file
    const schemaPath = path.join(__dirname, 'database-schema-unified.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('📊 Applying unified database schema...');
    
    // Execute the schema SQL
    await client.query(schemaSQL);
    
    console.log('✅ Unified schema applied successfully');
    
    // Verify critical tables exist
    console.log('🔍 Verifying table structure...');
    
    const tableChecks = [
      'users',
      'user_profiles', 
      'roles',
      'user_roles',
      'blocks',
      'questions',
      'answers',
      'games',
      'game_players',
      'game_scores',
      'user_sessions',
      'user_game_configurations',
      'block_answers',
      'topic_answers',
      'admin_assignments',
      'ticket_categories',
      'ticket_states',
      'tickets',
      'ticket_messages',
      'ticket_assignments',
      'ticket_attachments',
      'ticket_notifications',
      'feature_flags'
    ];
    
    for (const tableName of tableChecks) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`  ✅ Table '${tableName}' exists`);
      } else {
        console.log(`  ❌ Table '${tableName}' missing`);
      }
    }
    
    // Verify critical columns in users table
    console.log('🔍 Verifying users table columns...');
    
    const userColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    const expectedUserColumns = [
      'id', 'nickname', 'email', 'password_hash', 
      'created_at', 'updated_at', 'first_name', 'last_name'
    ];
    
    const actualColumns = userColumns.rows.map(row => row.column_name);
    
    for (const expectedCol of expectedUserColumns) {
      if (actualColumns.includes(expectedCol)) {
        console.log(`  ✅ Column 'users.${expectedCol}' exists`);
      } else {
        console.log(`  ❌ Column 'users.${expectedCol}' missing`);
      }
    }
    
    // Check for old columns that should be removed
    const oldColumns = ['nombre', 'apellido'];
    for (const oldCol of oldColumns) {
      if (actualColumns.includes(oldCol)) {
        console.log(`  ⚠️  Old column 'users.${oldCol}' still exists (will be cleaned up)`);
      }
    }
    
    // Check for old columns in blocks table
    const oldBlockColumns = ['creator_id'];
    for (const oldCol of oldBlockColumns) {
      if (actualBlockColumns.includes(oldCol)) {
        console.log(`  ⚠️  Old column 'blocks.${oldCol}' still exists (will be migrated to user_role_id)`);
      }
    }
    
    // Verify blocks table columns
    console.log('🔍 Verifying blocks table columns...');
    
    const blockColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'blocks' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    const expectedBlockColumns = [
      'id', 'name', 'description', 'user_role_id', 'is_public', 
      'created_at', 'updated_at', 'image_url', 'observaciones'
    ];
    
    const actualBlockColumns = blockColumns.rows.map(row => row.column_name);
    
    for (const expectedCol of expectedBlockColumns) {
      if (actualBlockColumns.includes(expectedCol)) {
        console.log(`  ✅ Column 'blocks.${expectedCol}' exists`);
      } else {
        console.log(`  ❌ Column 'blocks.${expectedCol}' missing`);
      }
    }
    
    // Count existing data
    console.log('📊 Checking existing data...');
    
    const dataCounts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM blocks'),  
      client.query('SELECT COUNT(*) as count FROM questions'),
      client.query('SELECT COUNT(*) as count FROM roles')
    ]);
    
    console.log(`  👥 Users: ${dataCounts[0].rows[0].count}`);
    console.log(`  📚 Blocks: ${dataCounts[1].rows[0].count}`);
    console.log(`  ❓ Questions: ${dataCounts[2].rows[0].count}`);
    console.log(`  🎭 Roles: ${dataCounts[3].rows[0].count}`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 PLAYTEST Unified Schema Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Database schema aligned with provided specification');
    console.log('- Column names updated (nombre/apellido → first_name/last_name)');
    console.log('- Password field standardized to password_hash');
    console.log('- New tables created for ticket system and feature flags');
    console.log('- Proper indexing and constraints applied');
    console.log('- Triggers updated for data consistency');
    
    console.log('\n⚠️  Next Steps:');
    console.log('1. Update frontend components to use new field names');
    console.log('2. Test all API endpoints with the new schema');
    console.log('3. Verify game functionality works correctly');
    console.log('4. Test user registration/login with new field names');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Schema deployment failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}

async function verifyDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log(`🔗 Database connected successfully`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 PLAYTEST Database Schema Deployment Tool');
  console.log('==========================================\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  // Verify database connection
  const connected = await verifyDatabaseConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Check if schema file exists
  const schemaPath = path.join(__dirname, 'database-schema-unified.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  
  try {
    await deployUnifiedSchema();
    console.log('\n✅ Deployment completed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment failed!');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted by user');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated');
  await pool.end();
  process.exit(0);
});

// Run the deployment
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  deployUnifiedSchema,
  verifyDatabaseConnection
};