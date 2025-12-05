const pool = require('./database/connection');

async function runTempFix() {
    console.log('\n\n🚀🚀🚀 INICIANDO MIGRACIÓN DE EMERGENCIA 🚀🚀🚀');
    console.log('OBJETIVO: Renombrar el rol "jugador" a "usuario".');

    try {
        const sql = `
            DO $$
            BEGIN
                -- Solo si 'jugador' existe y 'usuario' no, proceder al renombramiento.
                IF EXISTS (SELECT 1 FROM roles WHERE name = 'jugador') AND NOT EXISTS (SELECT 1 FROM roles WHERE name = 'usuario') THEN
                    UPDATE roles
                    SET name = 'usuario'
                    WHERE name = 'jugador';
                    RAISE NOTICE '✅ ÉXITO: El rol "jugador" ha sido renombrado a "usuario".';
                ELSE
                    RAISE NOTICE '✅ INFO: No se requirió ninguna acción. El rol "usuario" ya existe o "jugador" no fue encontrado.';
                END IF;
            END $$;
        `;

        console.log('📝 Ejecutando SQL de reparación de emergencia...');
        await pool.query(sql);

        console.log('\n✅✅✅ MIGRACIÓN DE EMERGENCIA COMPLETADA EXITOSAMENTE ✅✅✅\n\n');
        // Usamos process.exit(0) para indicar que el script terminó correctamente.
        // Esto es crucial para que el proceso de despliegue continúe.
        // Si no lo incluimos, el script podría "colgarse" y el despliegue fallaría por timeout.
    } catch (error) {
        console.error('\n❌❌❌ ERROR CRÍTICO EN LA MIGRACIÓN DE EMERGENCIA ❌❌❌\n', error);
        // Usamos process.exit(1) para detener inmediatamente el despliegue si hay un error.
        process.exit(1);
    }
}

// Esta función se asegura de que la conexión a la base de datos se cierre correctamente
// antes de que el script principal termine, para evitar que el proceso se quede colgado.
async function main() {
    await runTempFix();
    await pool.end();
    process.exit(0);
}

main();
