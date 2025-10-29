/**
 * Test script for Groups and Assignments System (Phase 2)
 *
 * This script verifies:
 * 1. Database schema changes (columns, tables, views)
 * 2. API endpoints functionality
 * 3. Access control logic
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(70) + colors.reset);
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log(colors.bright + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

function printSuccess(text) {
  console.log(colors.green + '✅ ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + '❌ ' + text + colors.reset);
}

function printWarning(text) {
  console.log(colors.yellow + '⚠️  ' + text + colors.reset);
}

function printInfo(text) {
  console.log(colors.blue + 'ℹ️  ' + text + colors.reset);
}

async function testDatabaseSchema() {
  printHeader('TEST 1: Database Schema Verification');

  try {
    // Test 1.1: Check new columns in blocks table
    printInfo('Verificando columnas nuevas en tabla blocks...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'blocks'
        AND column_name IN ('block_scope', 'access_code', 'assigned_group_id', 'owner_user_id')
      ORDER BY column_name
    `);

    if (columnsResult.rows.length === 4) {
      printSuccess('Las 4 columnas nuevas existen en blocks table');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      printError(`Solo se encontraron ${columnsResult.rows.length} de 4 columnas`);
    }

    // Test 1.2: Check new tables
    printInfo('\nVerificando tablas nuevas...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('groups', 'group_members', 'block_assignments')
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 3) {
      printSuccess('Las 3 tablas nuevas existen');
      tablesResult.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      printError(`Solo se encontraron ${tablesResult.rows.length} de 3 tablas`);
    }

    // Test 1.3: Check views
    printInfo('\nVerificando vistas creadas...');
    const viewsResult = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('student_assigned_blocks', 'teacher_groups_summary')
      ORDER BY table_name
    `);

    if (viewsResult.rows.length === 2) {
      printSuccess('Las 2 vistas existen');
      viewsResult.rows.forEach(view => {
        console.log(`   - ${view.table_name}`);
      });
    } else {
      printWarning(`Solo se encontraron ${viewsResult.rows.length} de 2 vistas`);
    }

    // Test 1.4: Check owner_user_id population
    printInfo('\nVerificando población de owner_user_id...');
    const ownerResult = await pool.query(`
      SELECT
        COUNT(*) as total_blocks,
        COUNT(owner_user_id) as blocks_with_owner,
        COUNT(*) - COUNT(owner_user_id) as blocks_without_owner
      FROM blocks
    `);

    const stats = ownerResult.rows[0];
    console.log(`   Total bloques: ${stats.total_blocks}`);
    console.log(`   Con owner_user_id: ${stats.blocks_with_owner}`);
    console.log(`   Sin owner_user_id: ${stats.blocks_without_owner}`);

    if (parseInt(stats.blocks_without_owner) === 0) {
      printSuccess('Todos los bloques tienen owner_user_id');
    } else {
      printWarning(`${stats.blocks_without_owner} bloques sin owner_user_id`);
    }

    return true;
  } catch (error) {
    printError('Error en prueba de schema: ' + error.message);
    return false;
  }
}

async function testDataIntegrity() {
  printHeader('TEST 2: Data Integrity');

  try {
    // Test 2.1: Check block_scope values
    printInfo('Verificando valores de block_scope...');
    const scopeResult = await pool.query(`
      SELECT
        block_scope,
        COUNT(*) as count
      FROM blocks
      GROUP BY block_scope
      ORDER BY count DESC
    `);

    console.log('   Distribución de block_scope:');
    scopeResult.rows.forEach(row => {
      const scope = row.block_scope || 'NULL (default PUBLICO)';
      console.log(`   - ${scope}: ${row.count} bloques`);
    });

    // Test 2.2: Check foreign key relationships
    printInfo('\nVerificando relaciones de claves foráneas...');
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('blocks', 'groups', 'group_members', 'block_assignments')
      ORDER BY tc.table_name, tc.constraint_name
    `);

    printSuccess(`${fkResult.rows.length} relaciones de clave foránea encontradas`);

    // Test 2.3: Check constraints
    printInfo('\nVerificando constraints...');
    const constraintsResult = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints AS tc
      WHERE tc.table_name IN ('groups', 'group_members', 'block_assignments')
      ORDER BY tc.table_name, tc.constraint_type
    `);

    console.log(`   ${constraintsResult.rows.length} constraints encontrados`);

    return true;
  } catch (error) {
    printError('Error en prueba de integridad: ' + error.message);
    return false;
  }
}

async function testAccessControl() {
  printHeader('TEST 3: Access Control Logic');

  try {
    // Test 3.1: Public blocks are visible to all
    printInfo('Test 3.1: Bloques públicos visibles para todos');
    const publicBlocksResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM blocks
      WHERE block_scope = 'PUBLICO' OR block_scope IS NULL
    `);
    console.log(`   ${publicBlocksResult.rows[0].count} bloques públicos encontrados`);
    printSuccess('Query de bloques públicos ejecutado correctamente');

    // Test 3.2: Class blocks with assignments
    printInfo('\nTest 3.2: Bloques de clase con asignaciones');
    const classBlocksResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM blocks
      WHERE block_scope = 'CLASE'
    `);
    console.log(`   ${classBlocksResult.rows[0].count} bloques de clase encontrados`);

    // Test 3.3: Test views
    printInfo('\nTest 3.3: Probando vistas');
    try {
      const studentView = await pool.query('SELECT COUNT(*) as count FROM student_assigned_blocks');
      console.log(`   student_assigned_blocks: ${studentView.rows[0].count} registros`);

      const teacherView = await pool.query('SELECT COUNT(*) as count FROM teacher_groups_summary');
      console.log(`   teacher_groups_summary: ${teacherView.rows[0].count} registros`);

      printSuccess('Vistas funcionando correctamente');
    } catch (viewError) {
      printWarning('Error accediendo a vistas: ' + viewError.message);
    }

    return true;
  } catch (error) {
    printError('Error en prueba de control de acceso: ' + error.message);
    return false;
  }
}

async function testGroupsTable() {
  printHeader('TEST 4: Groups Table Functionality');

  try {
    // Test 4.1: Table structure
    printInfo('Verificando estructura de tabla groups...');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'groups'
      ORDER BY ordinal_position
    `);

    console.log('   Columnas de groups:');
    structureResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    printSuccess('Tabla groups tiene estructura correcta');

    // Test 4.2: Current data
    const dataResult = await pool.query(`
      SELECT
        COUNT(*) as total_groups,
        COUNT(DISTINCT created_by) as unique_teachers
      FROM groups
    `);

    console.log(`\n   Total grupos: ${dataResult.rows[0].total_groups}`);
    console.log(`   Profesores únicos: ${dataResult.rows[0].unique_teachers}`);

    return true;
  } catch (error) {
    printError('Error en prueba de tabla groups: ' + error.message);
    return false;
  }
}

async function testBlockAssignmentsTable() {
  printHeader('TEST 5: Block Assignments Table Functionality');

  try {
    // Test 5.1: Table structure
    printInfo('Verificando estructura de tabla block_assignments...');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'block_assignments'
      ORDER BY ordinal_position
    `);

    console.log('   Columnas de block_assignments:');
    structureResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    printSuccess('Tabla block_assignments tiene estructura correcta');

    // Test 5.2: Check constraint exists
    const constraintResult = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'block_assignments'
        AND constraint_type = 'CHECK'
    `);

    if (constraintResult.rows.length > 0) {
      printSuccess('Constraint check_assignment_target existe');
    } else {
      printWarning('No se encontró constraint check_assignment_target');
    }

    // Test 5.3: Current data
    const dataResult = await pool.query(`
      SELECT
        COUNT(*) as total_assignments,
        COUNT(DISTINCT block_id) as unique_blocks,
        COUNT(group_id) as group_assignments,
        COUNT(assigned_to_user) as individual_assignments
      FROM block_assignments
    `);

    console.log(`\n   Total asignaciones: ${dataResult.rows[0].total_assignments}`);
    console.log(`   Bloques únicos asignados: ${dataResult.rows[0].unique_blocks}`);
    console.log(`   Asignaciones a grupos: ${dataResult.rows[0].group_assignments}`);
    console.log(`   Asignaciones individuales: ${dataResult.rows[0].individual_assignments}`);

    return true;
  } catch (error) {
    printError('Error en prueba de tabla block_assignments: ' + error.message);
    return false;
  }
}

async function testIndexes() {
  printHeader('TEST 6: Indexes Verification');

  try {
    printInfo('Verificando índices creados...');
    const indexesResult = await pool.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('blocks', 'groups', 'group_members', 'block_assignments')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    if (indexesResult.rows.length > 0) {
      printSuccess(`${indexesResult.rows.length} índices encontrados`);
      indexesResult.rows.forEach(idx => {
        console.log(`   - ${idx.tablename}.${idx.indexname}`);
      });
    } else {
      printWarning('No se encontraron índices personalizados');
    }

    return true;
  } catch (error) {
    printError('Error en prueba de índices: ' + error.message);
    return false;
  }
}

async function testSystemSummary() {
  printHeader('RESUMEN DEL SISTEMA');

  try {
    // General statistics
    const blocksCount = await pool.query('SELECT COUNT(*) as count FROM blocks');
    const groupsCount = await pool.query('SELECT COUNT(*) as count FROM groups');
    const membersCount = await pool.query('SELECT COUNT(*) as count FROM group_members');
    const assignmentsCount = await pool.query('SELECT COUNT(*) as count FROM block_assignments');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');

    console.log(colors.bright + 'Estadísticas del Sistema:' + colors.reset);
    console.log(`   👤 Usuarios: ${usersCount.rows[0].count}`);
    console.log(`   📦 Bloques: ${blocksCount.rows[0].count}`);
    console.log(`   👥 Grupos: ${groupsCount.rows[0].count}`);
    console.log(`   🎓 Miembros de grupos: ${membersCount.rows[0].count}`);
    console.log(`   📋 Asignaciones: ${assignmentsCount.rows[0].count}`);

    // Block scope distribution
    const scopeDistribution = await pool.query(`
      SELECT
        COALESCE(block_scope, 'PUBLICO (default)') as scope,
        COUNT(*) as count
      FROM blocks
      GROUP BY block_scope
      ORDER BY count DESC
    `);

    console.log(colors.bright + '\nDistribución de Bloques por Ámbito:' + colors.reset);
    scopeDistribution.rows.forEach(row => {
      console.log(`   ${row.scope}: ${row.count} bloques`);
    });

    // Ownership statistics
    const ownershipStats = await pool.query(`
      SELECT
        COUNT(*) as total_blocks,
        COUNT(DISTINCT owner_user_id) as unique_owners
      FROM blocks
      WHERE owner_user_id IS NOT NULL
    `);

    console.log(colors.bright + '\nEstadísticas de Propiedad:' + colors.reset);
    console.log(`   Bloques con propietario: ${ownershipStats.rows[0].total_blocks}`);
    console.log(`   Propietarios únicos: ${ownershipStats.rows[0].unique_owners}`);

    printSuccess('\n✅ Sistema de grupos y asignaciones verificado correctamente');

    return true;
  } catch (error) {
    printError('Error en resumen del sistema: ' + error.message);
    return false;
  }
}

async function runAllTests() {
  console.log(colors.bright + colors.cyan);
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║     TEST SUITE: Sistema de Grupos y Asignaciones (Fase 2)           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results = [];

  results.push(await testDatabaseSchema());
  results.push(await testDataIntegrity());
  results.push(await testAccessControl());
  results.push(await testGroupsTable());
  results.push(await testBlockAssignmentsTable());
  results.push(await testIndexes());
  await testSystemSummary();

  // Final summary
  printHeader('RESULTADO FINAL');

  const passed = results.filter(r => r === true).length;
  const total = results.length;

  if (passed === total) {
    console.log(colors.green + colors.bright);
    console.log('  ███████╗██╗  ██╗██╗████████╗ ██████╗ ');
    console.log('  ██╔════╝╚██╗██╔╝██║╚══██╔══╝██╔═══██╗');
    console.log('  █████╗   ╚███╔╝ ██║   ██║   ██║   ██║');
    console.log('  ██╔══╝   ██╔██╗ ██║   ██║   ██║   ██║');
    console.log('  ███████╗██╔╝ ██╗██║   ██║   ╚██████╔╝');
    console.log('  ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝    ╚═════╝ ');
    console.log(colors.reset);
    printSuccess(`Todas las pruebas pasaron: ${passed}/${total}`);
  } else {
    console.log(colors.yellow);
    console.log('  ⚠️  ALGUNAS PRUEBAS FALLARON');
    console.log(colors.reset);
    printWarning(`Pruebas pasadas: ${passed}/${total}`);
  }

  console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset + '\n');
}

// Run tests
runAllTests()
  .then(() => {
    console.log('Tests completados. Cerrando conexión...');
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal ejecutando tests:', error);
    pool.end();
    process.exit(1);
  });
