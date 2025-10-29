/**
 * Script para ejecutar la migración: Sistema de grupos y asignaciones (Fase 2)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

async function runMigration() {
  try {
    console.log('🔧 EJECUTANDO MIGRACIÓN: Sistema de Grupos y Asignaciones (Fase 2)\n');
    console.log('=' .repeat(70) + '\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'playtest-backend', 'migration-add-groups-and-assignments.sql');
    console.log('📄 Leyendo archivo SQL:', sqlPath);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Archivo SQL no encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Archivo SQL leído correctamente\n');

    // Execute migration
    console.log('⚙️  Ejecutando migración SQL...\n');
    await pool.query(sqlContent);
    console.log('✅ Migración SQL ejecutada correctamente\n');

    // Verification
    console.log('=' .repeat(70));
    console.log('🔍 VERIFICACIÓN DE MIGRACIÓN:\n');

    // 1. Check new columns in blocks
    console.log('1️⃣ Verificando nuevas columnas en tabla blocks...\n');
    const columnsResult = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'blocks'
        AND column_name IN ('block_scope', 'access_code', 'assigned_group_id', 'owner_user_id')
      ORDER BY column_name
    `);

    if (columnsResult.rows.length === 4) {
      console.log('✅ Las 4 columnas nuevas se agregaron correctamente:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      console.log();
    } else {
      console.log('❌ Error: Faltan columnas. Encontradas:', columnsResult.rows.length);
    }

    // 2. Check new tables
    console.log('2️⃣ Verificando nuevas tablas...\n');
    const tablesResult = await pool.query(`
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN ('groups', 'group_members', 'block_assignments')
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 3) {
      console.log('✅ Las 3 tablas nuevas se crearon correctamente:');
      tablesResult.rows.forEach(table => {
        console.log(`   - ${table.table_name} (${table.column_count} columnas)`);
      });
      console.log();
    } else {
      console.log('❌ Error: Faltan tablas. Encontradas:', tablesResult.rows.length);
    }

    // 3. Check owner_user_id population
    console.log('3️⃣ Verificando población de owner_user_id...\n');
    const ownerResult = await pool.query(`
      SELECT
        COUNT(*) as total_blocks,
        COUNT(owner_user_id) as blocks_with_owner,
        COUNT(*) - COUNT(owner_user_id) as blocks_without_owner
      FROM blocks
    `);

    const ownerStats = ownerResult.rows[0];
    console.log(`📊 Total de bloques: ${ownerStats.total_blocks}`);
    console.log(`✅ Bloques con owner_user_id: ${ownerStats.blocks_with_owner}`);

    if (parseInt(ownerStats.blocks_without_owner) > 0) {
      console.log(`⚠️  Bloques sin owner_user_id: ${ownerStats.blocks_without_owner}`);
    }
    console.log();

    // 4. Check views
    console.log('4️⃣ Verificando vistas creadas...\n');
    const viewsResult = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('student_assigned_blocks', 'teacher_groups_summary')
      ORDER BY table_name
    `);

    if (viewsResult.rows.length === 2) {
      console.log('✅ Las 2 vistas se crearon correctamente:');
      viewsResult.rows.forEach(view => {
        console.log(`   - ${view.table_name}`);
      });
      console.log();
    } else {
      console.log('⚠️  Vistas encontradas:', viewsResult.rows.length);
    }

    // 5. Sample data from new tables (should be empty)
    console.log('5️⃣ Conteo de registros en nuevas tablas...\n');

    const groupsCount = await pool.query('SELECT COUNT(*) as count FROM groups');
    const membersCount = await pool.query('SELECT COUNT(*) as count FROM group_members');
    const assignmentsCount = await pool.query('SELECT COUNT(*) as count FROM block_assignments');

    console.log(`📊 Grupos: ${groupsCount.rows[0].count}`);
    console.log(`📊 Miembros de grupos: ${membersCount.rows[0].count}`);
    console.log(`📊 Asignaciones de bloques: ${assignmentsCount.rows[0].count}`);
    console.log();

    // Summary
    console.log('=' .repeat(70));
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');

    console.log('📌 PRÓXIMOS PASOS:');
    console.log('1. Crear endpoints del backend para gestión de grupos');
    console.log('2. Crear endpoints para asignación de bloques');
    console.log('3. Actualizar lógica de acceso en GET /blocks');
    console.log('4. Implementar frontend para profesores (gestión de grupos)');
    console.log('5. Implementar frontend para alumnos (ver bloques asignados)\n');

    console.log('🎓 NUEVAS CAPACIDADES:');
    console.log('✅ Bloques públicos (PUBLICO) para todos');
    console.log('✅ Bloques de clase (CLASE) solo para grupos asignados');
    console.log('✅ Profesores pueden crear grupos con códigos de acceso');
    console.log('✅ Profesores pueden asignar bloques a grupos o alumnos');
    console.log('✅ Alumnos ven bloques públicos + asignados\n');

  } catch (error) {
    console.error('❌ ERROR EN MIGRACIÓN:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
