/**
 * Script de Verificación - Configuración de Duelo
 *
 * Este script verifica que la configuración de número de preguntas
 * se está guardando correctamente en la base de datos.
 *
 * Uso: node verify-duel-config.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function verifyDuelConfiguration() {
    console.log('🔍 Iniciando verificación de configuración de Duelo...\n');

    try {
        // 1. Verificar juegos recientes de tipo Duelo
        console.log('📊 Buscando juegos de Duelo recientes...');
        const gamesQuery = `
            SELECT
                id,
                mode,
                status,
                config,
                "configurationMetadata",
                "createdAt"
            FROM games
            WHERE mode = 'Duelo'
            ORDER BY "createdAt" DESC
            LIMIT 5
        `;

        const gamesResult = await pool.query(gamesQuery);

        if (gamesResult.rows.length === 0) {
            console.log('⚠️  No se encontraron juegos de Duelo recientes');
            console.log('💡 Sugerencia: Crea un juego de prueba primero\n');
            return;
        }

        console.log(`✅ Encontrados ${gamesResult.rows.length} juegos de Duelo\n`);

        // 2. Analizar cada juego
        for (const game of gamesResult.rows) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🎮 Juego ID: ${game.id}`);
            console.log(`📅 Creado: ${game.createdAt}`);
            console.log(`📊 Estado: ${game.status}`);
            console.log('');

            // 3. Verificar que config existe
            if (!game.config) {
                console.log('❌ ERROR: No hay configuración en este juego');
                continue;
            }

            // 4. Verificar shuffledQuestionIds
            const config = game.config;
            const shuffledIds = config.shuffledQuestionIds;

            if (!shuffledIds) {
                console.log('❌ ERROR: No se encontró shuffledQuestionIds en config');
                console.log('📋 Config recibido:', JSON.stringify(config, null, 2));
                continue;
            }

            if (!Array.isArray(shuffledIds)) {
                console.log('❌ ERROR: shuffledQuestionIds no es un array');
                console.log('📋 Tipo:', typeof shuffledIds);
                continue;
            }

            console.log('✅ shuffledQuestionIds encontrado');
            console.log(`📊 Número de preguntas: ${shuffledIds.length}`);
            console.log(`🆔 Primeros 5 IDs: [${shuffledIds.slice(0, 5).join(', ')}]`);
            console.log(`🆔 Últimos 5 IDs: [${shuffledIds.slice(-5).join(', ')}]`);

            // 5. Verificar el número de preguntas configurado
            let expectedQuestionCount = 20; // Default

            // Buscar duelQuestionCount en config
            if (config.duelQuestionCount) {
                expectedQuestionCount = config.duelQuestionCount;
                console.log(`✅ duelQuestionCount encontrado: ${expectedQuestionCount}`);
            } else {
                console.log('⚠️  duelQuestionCount no encontrado en config (usando default 20)');
            }

            // 6. Validar que coincide
            if (shuffledIds.length === expectedQuestionCount) {
                console.log(`✅ VALIDACIÓN EXITOSA: ${shuffledIds.length} preguntas = ${expectedQuestionCount} configurado`);
            } else {
                console.log(`❌ ERROR DE VALIDACIÓN: ${shuffledIds.length} preguntas != ${expectedQuestionCount} configurado`);
            }

            // 7. Verificar que las preguntas existen en la BD
            console.log('\n🔍 Verificando que las preguntas existen...');
            const questionsQuery = `
                SELECT COUNT(*) as count
                FROM questions
                WHERE id = ANY($1)
            `;

            const questionsResult = await pool.query(questionsQuery, [shuffledIds]);
            const foundQuestions = parseInt(questionsResult.rows[0].count);

            if (foundQuestions === shuffledIds.length) {
                console.log(`✅ Todas las ${foundQuestions} preguntas existen en la BD`);
            } else {
                console.log(`⚠️  Solo ${foundQuestions}/${shuffledIds.length} preguntas encontradas`);
                console.log('   Puede que algunas preguntas se hayan eliminado');
            }

            // 8. Verificar configuración de bloques
            console.log('\n🧩 Configuración de bloques:');
            const blockIds = Object.keys(config).filter(key => key !== 'shuffledQuestionIds' && key !== 'duelQuestionCount');
            console.log(`📦 Bloques configurados: ${blockIds.length}`);

            for (const blockId of blockIds) {
                const blockConfig = config[blockId];
                if (typeof blockConfig === 'object') {
                    const topics = blockConfig.topics;
                    if (topics === 'all') {
                        console.log(`   - Bloque ${blockId}: TODOS los temas`);
                    } else if (Array.isArray(topics)) {
                        console.log(`   - Bloque ${blockId}: ${topics.length} temas seleccionados`);
                    }
                }
            }

            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 9. Resumen de validación
        console.log('📊 RESUMEN DE VALIDACIÓN:\n');

        let validGames = 0;
        let gamesWithCorrectCount = 0;
        let gamesWithDuelQuestionCount = 0;

        for (const game of gamesResult.rows) {
            if (game.config?.shuffledQuestionIds) {
                validGames++;

                const config = game.config;
                const shuffledIds = config.shuffledQuestionIds;
                const duelCount = config.duelQuestionCount || 20;

                if (config.duelQuestionCount) {
                    gamesWithDuelQuestionCount++;
                }

                if (shuffledIds.length === duelCount) {
                    gamesWithCorrectCount++;
                }
            }
        }

        console.log(`✅ Juegos con shuffledQuestionIds válido: ${validGames}/${gamesResult.rows.length}`);
        console.log(`✅ Juegos con duelQuestionCount: ${gamesWithDuelQuestionCount}/${gamesResult.rows.length}`);
        console.log(`✅ Juegos con número correcto de preguntas: ${gamesWithCorrectCount}/${gamesResult.rows.length}`);

        if (gamesWithDuelQuestionCount === 0) {
            console.log('\n⚠️  ADVERTENCIA: Ningún juego tiene duelQuestionCount');
            console.log('   Esto es normal si son juegos creados antes del cambio');
            console.log('   Crea un nuevo juego para verificar la nueva funcionalidad');
        }

        if (validGames === gamesResult.rows.length && gamesWithCorrectCount === gamesResult.rows.length) {
            console.log('\n🎉 TODAS LAS VALIDACIONES PASARON EXITOSAMENTE');
        } else {
            console.log('\n⚠️  Algunas validaciones fallaron - revisar logs arriba');
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Función auxiliar para verificar opciones de configuración
async function verifyConfigOptions() {
    console.log('\n🔧 VERIFICACIÓN DE OPCIONES DE CONFIGURACIÓN:\n');

    const validCounts = [20, 30, 40, 50];
    console.log(`✅ Opciones válidas: ${validCounts.join(', ')}`);
    console.log(`✅ Valor por defecto: 20`);
    console.log(`✅ Formato: duelQuestionCount (número entero)`);
    console.log('');
}

// Ejecutar verificaciones
async function main() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DE CONFIGURACIÓN DE DUELO          ║');
    console.log('║  Número de Preguntas: 20/30/40/50               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    await verifyConfigOptions();
    await verifyDuelConfiguration();

    console.log('\n✅ Verificación completada\n');
}

main().catch(console.error);
