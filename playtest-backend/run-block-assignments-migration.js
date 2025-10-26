/**
 * Script de migración para crear la tabla block_assignments
 * Ejecutar con: node run-block-assignments-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando migración de block_assignments...');

    // Leer el archivo SQL de migración
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create-block-assignments-table.sql'),
      'utf8'
    );

    // Ejecutar la migración dentro de una transacción
    await client.query('BEGIN');

    console.log('📝 Ejecutando SQL de migración...');
    await client.query(migrationSQL);

    await client.query('COMMIT');

    console.log('✅ Migración completada exitosamente');

    // Verificar que la tabla fue creada
    const verifyResult = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'block_assignments'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Estructura de la tabla block_assignments:');
    console.table(verifyResult.rows);

    // Verificar índices
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'block_assignments';
    `);

    console.log('\n🔍 Índices creados:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la migración
runMigration()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 El proceso falló:', error.message);
    process.exit(1);
  });
