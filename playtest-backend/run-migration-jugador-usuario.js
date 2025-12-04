const pool = require('./database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Iniciando migración: jugador → usuario');

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'fix-jugador-to-usuario.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar la migración
        console.log('📝 Ejecutando migración SQL...');
        const result = await pool.query(sql);

        console.log('✅ Migración completada exitosamente');

        // Verificar resultado
        console.log('\n📊 Verificando roles existentes...');
        const rolesCheck = await pool.query(`
            SELECT name, description, hierarchy_level
            FROM roles
            WHERE name IN ('usuario', 'jugador')
            ORDER BY name
        `);

        if (rolesCheck.rows.length === 0) {
            console.log('⚠️  No se encontraron roles "usuario" ni "jugador"');
        } else {
            console.log('Roles encontrados:');
            rolesCheck.rows.forEach(role => {
                console.log(`  - ${role.name}: ${role.description} (nivel ${role.hierarchy_level})`);
            });
        }

        // Verificar usuarios afectados
        console.log('\n👥 Verificando usuarios con rol "usuario"...');
        const usersCheck = await pool.query(`
            SELECT COUNT(*) as count
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'usuario'
        `);
        console.log(`   Total usuarios con rol "usuario": ${usersCheck.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
        process.exit(1);
    }
}

runMigration();
