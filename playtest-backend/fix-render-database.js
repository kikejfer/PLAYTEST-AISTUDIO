#!/usr/bin/env node
/**
 * Script de reparación de emergencia para la base de datos de Render
 *
 * Este script se puede ejecutar manualmente para aplicar la migración
 * de mensajería directa en el servidor de Render.
 *
 * Uso:
 *   node fix-render-database.js
 *
 * O desde npm:
 *   npm run fix-db
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

// Validar que existe la variable DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  console.error('\nAsegúrate de tener un archivo .env con:');
  console.error('DATABASE_URL=postgresql://...\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Diagnóstico completo de la base de datos
 */
async function diagnosticDatabase(client) {
  console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS\n');

  // Verificar tablas
  const tablesResult = await client.query(`
    SELECT
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') as has_conversations,
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'direct_messages') as has_direct_messages,
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'typing_status') as has_typing_status,
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_online_status') as has_user_online_status,
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_settings') as has_conversation_settings,
      EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_attachments') as has_message_attachments
  `);

  const tables = tablesResult.rows[0];

  console.log('Tablas:');
  Object.entries(tables).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${key.replace('has_', '')}`);
  });

  // Verificar funciones
  const functionsResult = await client.query(`
    SELECT
      EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_expired_typing_status') as has_cleanup_function,
      EXISTS (SELECT FROM pg_proc WHERE proname = 'get_or_create_conversation') as has_get_or_create,
      EXISTS (SELECT FROM pg_proc WHERE proname = 'mark_conversation_as_read') as has_mark_read,
      EXISTS (SELECT FROM pg_proc WHERE proname = 'get_user_conversations') as has_get_conversations
  `);

  const functions = functionsResult.rows[0];

  console.log('\nFunciones:');
  Object.entries(functions).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${key.replace('has_', '')}`);
  });

  // Determinar si necesita reparación
  const needsRepair = Object.values(tables).includes(false) || Object.values(functions).includes(false);

  return { tables, functions, needsRepair };
}

/**
 * Aplicar migración de mensajería directa
 */
async function applyDirectMessagingMigration(client) {
  console.log('\n📝 APLICANDO MIGRACIÓN DE MENSAJERÍA DIRECTA\n');

  const migrationPath = path.join(__dirname, 'migrations', '001-add-direct-messaging.sql');

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`❌ Archivo de migración no encontrado: ${migrationPath}`);
  }

  console.log(`Leyendo migración desde: ${migrationPath}`);

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Ejecutando migración...');

  try {
    await client.query(migrationSQL);
    console.log('✅ Migración aplicada exitosamente');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Algunos objetos ya existían (esto es normal si la migración se ejecutó parcialmente)');
    } else {
      throw error;
    }
  }
}

/**
 * Verificar que los endpoints críticos funcionarían
 */
async function testCriticalQueries(client) {
  console.log('\n🧪 PROBANDO QUERIES CRÍTICAS\n');

  // Test 1: Contar mensajes no leídos
  try {
    await client.query(`
      SELECT COUNT(*) as unread_count
      FROM direct_messages
      WHERE is_read = false AND deleted_at IS NULL
    `);
    console.log('  ✅ Query de mensajes no leídos funciona');
  } catch (error) {
    console.log('  ❌ Query de mensajes no leídos falló:', error.message);
  }

  // Test 2: Función cleanup_expired_typing_status
  try {
    await client.query('SELECT cleanup_expired_typing_status()');
    console.log('  ✅ Función cleanup_expired_typing_status() funciona');
  } catch (error) {
    console.log('  ❌ Función cleanup_expired_typing_status() falló:', error.message);
  }

  // Test 3: Vista unread_message_counts
  try {
    await client.query('SELECT * FROM unread_message_counts LIMIT 1');
    console.log('  ✅ Vista unread_message_counts funciona');
  } catch (error) {
    console.log('  ❌ Vista unread_message_counts falló:', error.message);
  }
}

/**
 * Función principal
 */
async function main() {
  const client = await pool.connect();

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  🔧 REPARACIÓN DE BASE DE DATOS - PLAYTEST');
    console.log('='.repeat(70) + '\n');

    console.log(`Conectando a: ${process.env.DATABASE_URL.split('@')[1] || 'base de datos'}\n`);

    // Paso 1: Diagnóstico
    const diagnostic = await diagnosticDatabase(client);

    if (!diagnostic.needsRepair) {
      console.log('\n✅ La base de datos está correctamente configurada. No se necesita reparación.\n');

      // Ejecutar tests para confirmar
      await testCriticalQueries(client);

      console.log('\n' + '='.repeat(70));
      console.log('  ✅ BASE DE DATOS VERIFICADA');
      console.log('='.repeat(70) + '\n');
      return;
    }

    // Paso 2: Aplicar reparación
    console.log('\n⚠️  Se detectaron problemas. Aplicando reparación...\n');

    await applyDirectMessagingMigration(client);

    // Paso 3: Verificar reparación
    console.log('\n🔍 VERIFICANDO REPARACIÓN\n');
    const postDiagnostic = await diagnosticDatabase(client);

    if (postDiagnostic.needsRepair) {
      console.log('\n⚠️  ADVERTENCIA: Algunos problemas persisten\n');
    } else {
      console.log('\n✅ Todos los problemas fueron resueltos\n');
    }

    // Paso 4: Tests finales
    await testCriticalQueries(client);

    console.log('\n' + '='.repeat(70));
    console.log('  ✅ REPARACIÓN COMPLETADA');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('  ❌ ERROR EN LA REPARACIÓN');
    console.error('='.repeat(70));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    console.error('\n💡 Intenta ejecutar la migración manualmente desde Render Shell:\n');
    console.error('   psql $DATABASE_URL < playtest-backend/migrations/001-add-direct-messaging.sql\n');
    process.exit(1);

  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, diagnosticDatabase, applyDirectMessagingMigration };
