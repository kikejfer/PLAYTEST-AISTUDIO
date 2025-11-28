/**
 * Script para ejecutar migraciones críticas directamente
 * Ejecutar: node run-critical-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runCriticalMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting critical migrations...');
    console.log('📍 Connected to database');

    // 1. Add avatar_url column
    console.log('\n📝 Step 1: Adding avatar_url column to users table...');
    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)');
      console.log('✅ avatar_url column added');
    } catch (error) {
      console.log('⚠️  avatar_url column already exists or error:', error.message);
    }

    // 2. Apply direct messaging migration
    console.log('\n📝 Step 2: Applying direct messaging migration...');
    const migrationPath = path.join(__dirname, 'migrations', '001-add-direct-messaging.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await client.query(migrationSQL);
        console.log('✅ Direct messaging migration applied successfully');
      } catch (error) {
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log('⚠️  Direct messaging tables already exist (OK)');
        } else {
          console.error('❌ Error applying direct messaging migration:', error.message);
          throw error;
        }
      }
    } else {
      console.error('❌ Migration file not found:', migrationPath);
    }

    // 3. Apply teachers panel schema
    console.log('\n📝 Step 3: Applying teachers panel schema...');
    const schemaPath = path.join(__dirname, 'database-schema-teachers-panel.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

      try {
        await client.query(schemaSQL);
        console.log('✅ Teachers panel schema applied successfully');
      } catch (error) {
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log('⚠️  Teachers panel tables already exist (OK)');
        } else {
          console.error('❌ Error applying teachers panel schema:', error.message);
          throw error;
        }
      }
    } else {
      console.error('❌ Schema file not found:', schemaPath);
    }

    // 4. Apply Luminarias schema
    console.log('\n📝 Step 4: Applying Luminarias system schema...');
    const luminariasSchemaPath = path.join(__dirname, '..', 'database-schema-luminarias.sql');

    if (fs.existsSync(luminariasSchemaPath)) {
      const luminariasSQL = fs.readFileSync(luminariasSchemaPath, 'utf8');

      try {
        await client.query(luminariasSQL);
        console.log('✅ Luminarias schema applied successfully');

        // Create initial Luminarias accounts for existing users
        console.log('👥 Creating Luminarias accounts for existing users...');
        await client.query(`
          INSERT INTO user_luminarias (user_id, current_balance, total_earned, lifetime_earnings)
          SELECT
            u.id,
            200,  -- Initial balance
            200,  -- Total earned
            200   -- Lifetime earnings
          FROM users u
          LEFT JOIN user_luminarias ul ON u.id = ul.user_id
          WHERE ul.user_id IS NULL
          ON CONFLICT (user_id) DO NOTHING;
        `);

        const usersWithLuminarias = await client.query('SELECT COUNT(*) as count FROM user_luminarias');
        console.log(`✅ ${usersWithLuminarias.rows[0].count} users have Luminarias accounts`);

      } catch (error) {
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log('⚠️  Luminarias tables already exist (OK)');
        } else {
          console.error('❌ Error applying Luminarias schema:', error.message);
          console.error('Error details:', error);
          // Don't throw - continue with other migrations
        }
      }
    } else {
      console.log('⚠️  Luminarias schema file not found (will skip):', luminariasSchemaPath);
    }

    // 5. Apply game_scores columns fix
    console.log('\n📝 Step 5: Fixing game_scores and user_profiles columns...');
    const gameScoresFixPath = path.join(__dirname, 'migrations', '002-fix-game-scores-columns.sql');

    if (fs.existsSync(gameScoresFixPath)) {
      const gameScoresFixSQL = fs.readFileSync(gameScoresFixPath, 'utf8');

      try {
        await client.query(gameScoresFixSQL);
        console.log('✅ game_scores and user_profiles columns fixed successfully');
      } catch (error) {
        if (error.message.includes('already exists') || error.code === '42701') {
          console.log('⚠️  Columns already exist (OK)');
        } else {
          console.error('❌ Error fixing columns:', error.message);
          // Don't throw - continue with other migrations
        }
      }
    } else {
      console.log('⚠️  game_scores fix file not found (will skip):', gameScoresFixPath);
    }

    // 6. Verify tables and columns exist
    console.log('\n🔍 Verifying tables and columns...');
    const verifications = [
      { name: 'users.avatar_url', query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url'" },
      { name: 'conversations', query: "SELECT tablename FROM pg_tables WHERE tablename = 'conversations'" },
      { name: 'direct_messages', query: "SELECT tablename FROM pg_tables WHERE tablename = 'direct_messages'" },
      { name: 'teacher_classes', query: "SELECT tablename FROM pg_tables WHERE tablename = 'teacher_classes'" },
      { name: 'class_enrollments', query: "SELECT tablename FROM pg_tables WHERE tablename = 'class_enrollments'" },
      { name: 'user_luminarias', query: "SELECT tablename FROM pg_tables WHERE tablename = 'user_luminarias'" },
      { name: 'luminarias_transactions', query: "SELECT tablename FROM pg_tables WHERE tablename = 'luminarias_transactions'" },
      { name: 'luminarias_config', query: "SELECT tablename FROM pg_tables WHERE tablename = 'luminarias_config'" },
      { name: 'game_scores.user_id', query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'game_scores' AND column_name = 'user_id'" },
      { name: 'game_scores.score', query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'game_scores' AND column_name = 'score'" },
      { name: 'user_profiles.last_activity', query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_activity'" }
    ];

    for (const check of verifications) {
      const result = await client.query(check.query);
      if (result.rows.length > 0) {
        console.log(`✅ ${check.name} exists`);
      } else {
        console.log(`❌ ${check.name} MISSING`);
      }
    }

    console.log('\n✨ Critical migrations completed!');
    
  } catch (error) {
    console.error('\n💥 Critical error during migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runCriticalMigrations()
  .then(() => {
    console.log('\n🎉 All done! You can now restart your server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
