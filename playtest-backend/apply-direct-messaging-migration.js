/**
 * Script para aplicar la migración del sistema de mensajería directa
 * Ejecutar con: node apply-direct-messaging-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Verificar si las tablas de mensajería directa ya existen
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
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'message_attachments'
                ) as has_message_attachments,
                EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'typing_status'
                ) as has_typing_status,
                EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'user_online_status'
                ) as has_user_online_status,
                EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'conversation_settings'
                ) as has_conversation_settings
        `);

        const row = result.rows[0];
        return {
            complete: Object.values(row).every(v => v === true),
            details: row
        };
    } finally {
        client.release();
    }
}

/**
 * Aplicar la migración desde el archivo SQL
 */
async function applyMigration() {
    const client = await pool.connect();
    try {
        console.log('📝 Aplicando migración de mensajería directa...\n');

        const migrationPath = path.join(__dirname, 'migrations', '001-add-direct-messaging.sql');

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Ejecutar la migración
        await client.query(migrationSQL);

        console.log('✅ Migración aplicada exitosamente\n');
        return true;

    } catch (error) {
        console.error('❌ Error aplicando migración:', error.message);
        console.error(error.stack);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Verificar que todas las funciones se crearon correctamente
 */
async function verifyFunctions() {
    const client = await pool.connect();
    try {
        const functionsToCheck = [
            'update_conversation_last_message',
            'notify_direct_message',
            'mark_message_as_read',
            'mark_conversation_as_read',
            'get_user_conversations',
            'get_or_create_conversation',
            'cleanup_expired_typing_status'
        ];

        console.log('🔍 Verificando funciones creadas...\n');

        for (const funcName of functionsToCheck) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM pg_proc
                    WHERE proname = $1
                );
            `, [funcName]);

            const exists = result.rows[0].exists;
            console.log(`${exists ? '✅' : '❌'} ${funcName}`);

            if (!exists) {
                throw new Error(`Función ${funcName} no fue creada correctamente`);
            }
        }

        console.log('\n✅ Todas las funciones fueron creadas correctamente\n');
        return true;

    } finally {
        client.release();
    }
}

/**
 * Verificar índices
 */
async function verifyIndexes() {
    const client = await pool.connect();
    try {
        console.log('🔍 Verificando índices...\n');

        const result = await client.query(`
            SELECT
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (
                tablename IN ('conversations', 'direct_messages', 'message_attachments', 'typing_status', 'user_online_status', 'conversation_settings')
            )
            ORDER BY tablename, indexname;
        `);

        console.log(`✅ Se crearon ${result.rows.length} índices:\n`);

        const groupedByTable = {};
        result.rows.forEach(row => {
            if (!groupedByTable[row.tablename]) {
                groupedByTable[row.tablename] = [];
            }
            groupedByTable[row.tablename].push(row.indexname);
        });

        Object.entries(groupedByTable).forEach(([table, indexes]) => {
            console.log(`  ${table}: ${indexes.length} índices`);
        });

        console.log();
        return true;

    } finally {
        client.release();
    }
}

/**
 * Mostrar estadísticas de la base de datos
 */
async function showStats() {
    const client = await pool.connect();
    try {
        console.log('📊 Estadísticas de las tablas:\n');

        const tables = [
            'conversations',
            'direct_messages',
            'message_attachments',
            'typing_status',
            'user_online_status',
            'conversation_settings'
        ];

        for (const table of tables) {
            const result = await client.query(`
                SELECT COUNT(*) as count FROM ${table}
            `);
            const count = result.rows[0].count;
            console.log(`  ${table}: ${count} registros`);
        }

        console.log();

    } finally {
        client.release();
    }
}

/**
 * Función principal
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('  MIGRACIÓN: Sistema de Mensajería Directa');
    console.log('='.repeat(60) + '\n');

    try {
        // 1. Verificar estado actual
        console.log('🔍 Verificando estado actual de la base de datos...\n');
        const status = await checkDirectMessagingTables();

        if (status.complete) {
            console.log('✅ Las tablas de mensajería directa ya existen\n');
            console.log('Detalles:');
            Object.entries(status.details).forEach(([key, value]) => {
                console.log(`  ${key}: ${value ? '✅' : '❌'}`);
            });

            console.log('\n💡 Si deseas aplicar la migración de nuevo, elimina las tablas manualmente primero.\n');

            // Mostrar estadísticas
            await showStats();

        } else {
            console.log('⚠️  Algunas tablas no existen aún\n');
            console.log('Detalles:');
            Object.entries(status.details).forEach(([key, value]) => {
                console.log(`  ${key}: ${value ? '✅' : '❌'}`);
            });

            // 2. Aplicar migración
            console.log('\n📝 Aplicando migración...\n');
            await applyMigration();

            // 3. Verificar funciones
            await verifyFunctions();

            // 4. Verificar índices
            await verifyIndexes();

            // 5. Mostrar estadísticas
            await showStats();

            console.log('='.repeat(60));
            console.log('  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
            console.log('='.repeat(60) + '\n');
        }

        // Verificar estado final
        const finalStatus = await checkDirectMessagingTables();
        if (!finalStatus.complete) {
            throw new Error('La migración se completó pero algunas tablas no fueron creadas');
        }

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('  ❌ ERROR EN LA MIGRACIÓN');
        console.error('='.repeat(60));
        console.error('\nError:', error.message);
        console.error('\nStack:', error.stack);
        process.exit(1);

    } finally {
        await pool.end();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    checkDirectMessagingTables,
    applyMigration,
    verifyFunctions,
    verifyIndexes
};
