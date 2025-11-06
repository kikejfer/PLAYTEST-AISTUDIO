const { pool } = require('../database/connection');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN: Reorganización a Modelo de Oposiciones            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Verificar conexión
    console.log('📡 Verificando conexión a la base de datos...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', connectionTest.rows[0].now);

    // Advertencia
    console.log('\n⚠️  ADVERTENCIA ⚠️');
    console.log('Esta migración realizará los siguientes cambios:');
    console.log('  1. Renombrará teacher_classes → oposiciones');
    console.log('  2. Eliminará tablas: attendance_tracking, pedagogical_interventions');
    console.log('     (Se crearán respaldos: _backup_attendance_tracking, _backup_pedagogical_interventions)');
    console.log('  3. Creará nuevas tablas: bloques_temas, temas, cronograma_alumno, etc.');
    console.log('  4. Actualizará relaciones y foreign keys\n');

    const answer = await askQuestion('¿Deseas continuar? (escribe "SI" para confirmar): ');

    if (answer.trim().toUpperCase() !== 'SI') {
      console.log('\n❌ Migración cancelada por el usuario.');
      rl.close();
      process.exit(0);
    }

    // Leer archivo SQL
    console.log('\n📄 Leyendo script de migración...');
    const migrationPath = path.join(__dirname, '../migrations/reorganize-to-oposiciones-model.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Script cargado correctamente');

    // Crear respaldo automático
    console.log('\n💾 Creando respaldo de seguridad...');
    const backupPath = path.join(__dirname, `../../backups/backup-pre-migration-${Date.now()}.sql`);

    // Nota: Este es un respaldo lógico simple. Para producción, usar pg_dump
    const backupQuery = `
      -- Respaldo automático pre-migración
      CREATE TABLE IF NOT EXISTS _backup_teacher_classes_pre_migration AS SELECT * FROM teacher_classes;
      CREATE TABLE IF NOT EXISTS _backup_class_enrollments_pre_migration AS SELECT * FROM class_enrollments;
    `;
    await pool.query(backupQuery);
    console.log('✅ Respaldo creado');

    // Ejecutar migración
    console.log('\n🚀 Ejecutando migración...\n');
    console.log('═'.repeat(70));

    const result = await pool.query(migrationSQL);

    console.log('═'.repeat(70));
    console.log('\n✅ ¡Migración completada exitosamente!');

    // Verificación post-migración
    console.log('\n🔍 Verificando migración...');

    const verificationQueries = [
      {
        query: "SELECT COUNT(*) as count FROM oposiciones",
        label: "Oposiciones migradas"
      },
      {
        query: "SELECT COUNT(*) as count FROM bloques_temas",
        label: "Bloques de temas creados"
      },
      {
        query: "SELECT COUNT(*) as count FROM temas",
        label: "Temas creados"
      },
      {
        query: "SELECT COUNT(*) as count FROM cronograma_alumno",
        label: "Cronogramas de alumnos"
      },
      {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_name IN ('oposiciones', 'bloques_temas', 'temas', 'cronograma_alumno', 'cronograma_bloques', 'comentarios_profesor', 'dominio_preguntas')
          ORDER BY table_name
        `,
        label: "Nuevas tablas creadas",
        isArray: true
      }
    ];

    for (const check of verificationQueries) {
      try {
        const res = await pool.query(check.query);
        if (check.isArray) {
          console.log(`  ✓ ${check.label}:`);
          res.rows.forEach(row => {
            console.log(`    - ${row.table_name}`);
          });
        } else {
          console.log(`  ✓ ${check.label}: ${res.rows[0].count}`);
        }
      } catch (err) {
        console.log(`  ⚠️  ${check.label}: Error - ${err.message}`);
      }
    }

    console.log('\n📝 SIGUIENTE PASOS:');
    console.log('  1. Verificar que los datos se migraron correctamente');
    console.log('  2. Actualizar código del backend (controladores, rutas)');
    console.log('  3. Actualizar código del frontend (panel profesor, panel alumno)');
    console.log('  4. Ejecutar tests de integración');
    console.log('  5. Si todo funciona, eliminar tablas de respaldo:\n');
    console.log('     DROP TABLE _backup_teacher_classes_pre_migration;');
    console.log('     DROP TABLE _backup_class_enrollments_pre_migration;');
    console.log('     DROP TABLE _backup_attendance_tracking;');
    console.log('     DROP TABLE _backup_pedagogical_interventions;\n');

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRACIÓN EXITOSA                                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la migración:');
    console.error(error);
    console.error('\n⚠️  La migración falló. Verificar el estado de la base de datos.');
    console.error('    Si es necesario, ejecutar rollback usando el README-MIGRATION.md\n');
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Ejecutar migración
runMigration();
