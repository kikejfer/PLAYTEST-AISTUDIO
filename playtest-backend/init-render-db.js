/**
 * Script de inicialización de base de datos para Render
 * Este script se ejecuta automáticamente después del build (postbuild hook)
 * Aplica todas las migraciones necesarias para el sistema PLAYTEST
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Verificar si las tablas de mensajería directa ya existen
 */
async function checkDirectMessagingTables(client) {
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
  return {
    complete: row.has_conversations && row.has_direct_messages && row.has_cleanup_function,
    details: row
  };
}

/**
 * Aplicar migración de mensajería directa
 */
async function applyDirectMessagingMigration(client) {
  console.log('📝 Aplicando migración de mensajería directa...');

  const migrationPath = path.join(__dirname, 'migrations', '001-add-direct-messaging.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  await client.query(migrationSQL);

  console.log('✅ Migración de mensajería directa aplicada');
}

/**
 * Verificar funciones críticas
 */
async function verifyFunctions(client) {
  console.log('🔍 Verificando funciones críticas...');

  const functionsToCheck = [
    'cleanup_expired_typing_status',
    'get_or_create_conversation',
    'mark_conversation_as_read',
    'mark_message_as_read'
  ];

  for (const funcName of functionsToCheck) {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = $1
      );
    `, [funcName]);

    const exists = result.rows[0].exists;

    if (exists) {
      console.log(`  ✅ ${funcName}`);
    } else {
      console.log(`  ❌ ${funcName} - FALTA`);
      return false;
    }
  }

  console.log('✅ Todas las funciones críticas existen');
  return true;
}

/**
 * Verificar tablas críticas
 */
async function verifyTables(client) {
  console.log('🔍 Verificando tablas críticas...');

  const tablesToCheck = [
    'users',
    'conversations',
    'direct_messages',
    'typing_status',
    'user_online_status',
    'conversation_settings',
    'message_attachments'
  ];

  for (const tableName of tablesToCheck) {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      );
    `, [tableName]);

    const exists = result.rows[0].exists;

    if (exists) {
      console.log(`  ✅ ${tableName}`);
    } else {
      console.log(`  ⚠️  ${tableName} - FALTA`);
    }
  }
}

/**
 * Función principal
 */
async function main() {
  const client = await pool.connect();

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  🚀 INICIALIZANDO BASE DE DATOS - PLAYTEST');
    console.log('='.repeat(70) + '\n');

    // Verificar si ya existe el sistema de mensajería
    console.log('🔍 Verificando estado actual de la base de datos...\n');
    const status = await checkDirectMessagingTables(client);

    console.log('Estado de mensajería directa:');
    console.log(`  conversations: ${status.details.has_conversations ? '✅' : '❌'}`);
    console.log(`  direct_messages: ${status.details.has_direct_messages ? '✅' : '❌'}`);
    console.log(`  cleanup_expired_typing_status(): ${status.details.has_cleanup_function ? '✅' : '❌'}`);
    console.log();

    if (!status.complete) {
      console.log('⚠️  Sistema de mensajería directa no está completo. Aplicando migración...\n');
      await applyDirectMessagingMigration(client);
      console.log();
    } else {
      console.log('✅ Sistema de mensajería directa ya está configurado\n');
    }

    // Verificar estado final
    await verifyTables(client);
    console.log();

    const functionsOk = await verifyFunctions(client);
    console.log();

    if (functionsOk) {
      console.log('='.repeat(70));
      console.log('  ✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE');
      console.log('='.repeat(70) + '\n');
    } else {
      console.log('='.repeat(70));
      console.log('  ⚠️  ADVERTENCIA: Algunas funciones faltan');
      console.log('='.repeat(70) + '\n');
    }

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('  ❌ ERROR EN LA INICIALIZACIÓN');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);

    // No hacer exit(1) en producción para no detener el deploy
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.error('\n⚠️  Continuando con el deploy a pesar del error...\n');
    }

  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
}

module.exports = { main };
