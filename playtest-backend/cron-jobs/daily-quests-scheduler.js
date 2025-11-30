const cron = require('node-cron');
const { pool } = require('../database/connection');

// =====================================================
// CRON JOBS PARA SISTEMA DE MISIONES DIARIAS
// =====================================================

class DailyQuestsScheduler {
    constructor() {
        this.isRunning = false;
        this.jobs = [];
    }

    /**
     * Verifica si las tablas necesarias existen en la base de datos
     */
    async checkTablesExist() {
        try {
            const result = await pool.query(`
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('daily_quest_templates', 'user_daily_quests')
            `);
            return parseInt(result.rows[0].count) === 2;
        } catch (error) {
            console.error('Error verificando tablas:', error.message);
            return false;
        }
    }

    /**
     * Inicia todos los cron jobs del sistema de misiones diarias
     */
    async start() {
        console.log('🎯 Iniciando sistema de misiones diarias...');

        // Verificar si las tablas necesarias existen
        const tablesExist = await this.checkTablesExist();
        if (!tablesExist) {
            console.warn('⚠️  Misiones diarias deshabilitadas: ejecuta las migraciones SQL primero');
            console.warn('   Ver: MIGRACION_COMPLETA_NUEVAS_FEATURES.sql');
            return;
        }

        // Job 1: Generar misiones diarias a las 00:01 todos los días
        const generateQuestsJob = cron.schedule('1 0 * * *', async () => {
            console.log('🌅 [Daily Quests] Generando misiones diarias...');
            try {
                await this.generateDailyQuests();
                console.log('✅ [Daily Quests] Misiones diarias generadas');
            } catch (error) {
                console.error('❌ [Daily Quests] Error generando misiones:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        // Job 2: Expirar misiones antiguas a las 00:30 todos los días
        const expireQuestsJob = cron.schedule('30 0 * * *', async () => {
            console.log('⏰ [Daily Quests] Expirando misiones antiguas...');
            try {
                await this.expireOldQuests();
                console.log('✅ [Daily Quests] Misiones antiguas expiradas');
            } catch (error) {
                console.error('❌ [Daily Quests] Error expirando misiones:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        // Job 3: Verificación cada hora de progreso automático (login, tiempo, etc.)
        const autoProgressJob = cron.schedule('0 * * * *', async () => {
            console.log('🔄 [Daily Quests] Verificando progreso automático...');
            try {
                await this.updateAutoProgress();
                console.log('✅ [Daily Quests] Progreso automático actualizado');
            } catch (error) {
                console.error('❌ [Daily Quests] Error en progreso automático:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        this.jobs.push(generateQuestsJob, expireQuestsJob, autoProgressJob);
        this.isRunning = true;

        console.log('✅ Sistema de misiones diarias iniciado');
        console.log('   - Generación diaria: 00:01');
        console.log('   - Expiración: 00:30');
        console.log('   - Verificación horaria de progreso');

        // Ejecutar generación inicial si es necesario
        this.checkAndGenerateInitialQuests().catch(err => {
            console.error('Error en verificación inicial:', err.message);
        });
    }

    /**
     * Detiene todos los cron jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        this.isRunning = false;
        console.log('⏹️  Sistema de misiones diarias detenido');
    }

    /**
     * Genera misiones diarias para todos los usuarios activos
     */
    async generateDailyQuests() {
        const client = await pool.connect();

        try {
            // Obtener usuarios activos (actividad en últimos 30 días)
            const usersResult = await client.query(`
                SELECT DISTINCT u.id, u.nickname
                FROM users u
                WHERE EXISTS (
                    SELECT 1 FROM user_activity_metrics uam
                    WHERE uam.user_id = u.id
                    AND uam.last_activity >= NOW() - INTERVAL '30 days'
                )
                OR EXISTS (
                    SELECT 1 FROM user_sessions us
                    WHERE us.user_id = u.id
                    AND us.created_at >= NOW() - INTERVAL '30 days'
                )
            `);

            const today = new Date().toISOString().split('T')[0];
            let usersProcessed = 0;
            let questsGenerated = 0;

            for (const user of usersResult.rows) {
                // Verificar si ya tiene misiones para hoy
                const existingCheck = await client.query(`
                    SELECT id FROM user_daily_quests
                    WHERE user_id = $1 AND quest_date = $2
                `, [user.id, today]);

                if (existingCheck.rows.length > 0) {
                    continue; // Ya tiene misiones
                }

                // Generar 3 misiones: fácil, media, difícil
                const difficulties = ['easy', 'medium', 'hard'];

                for (const difficulty of difficulties) {
                    const templateResult = await client.query(`
                        SELECT id, target_value
                        FROM daily_quest_templates
                        WHERE difficulty = $1 AND is_active = TRUE
                        ORDER BY RANDOM() * weight DESC
                        LIMIT 1
                    `, [difficulty]);

                    if (templateResult.rows.length > 0) {
                        const template = templateResult.rows[0];

                        await client.query(`
                            INSERT INTO user_daily_quests (user_id, template_id, quest_date, target_value)
                            VALUES ($1, $2, $3, $4)
                        `, [user.id, template.id, today, template.target_value]);

                        questsGenerated++;
                    }
                }

                usersProcessed++;
            }

            console.log(`📊 Misiones generadas: ${questsGenerated} para ${usersProcessed} usuarios`);

            return { usersProcessed, questsGenerated };
        } finally {
            client.release();
        }
    }

    /**
     * Expira misiones del día anterior que no fueron completadas
     */
    async expireOldQuests() {
        try {
            const result = await pool.query('SELECT expire_old_daily_quests()');
            const expiredCount = result.rows[0].expire_old_daily_quests;

            console.log(`📊 Misiones expiradas: ${expiredCount}`);

            return expiredCount;
        } catch (error) {
            console.error('Error expirando misiones:', error);
            throw error;
        }
    }

    /**
     * Actualiza progreso automático para misiones de tipo login y tiempo
     */
    async updateAutoProgress() {
        const client = await pool.connect();

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Actualizar misiones de "daily_login"
            const loginResult = await client.query(`
                UPDATE user_daily_quests uq
                SET current_progress = 1
                FROM daily_quest_templates t
                WHERE uq.template_id = t.id
                AND t.quest_type = 'daily_login'
                AND uq.quest_date = $1
                AND uq.status = 'active'
                AND uq.current_progress = 0
                AND EXISTS (
                    SELECT 1 FROM user_sessions us
                    WHERE us.user_id = uq.user_id
                    AND us.created_at::DATE = $1
                )
            `, [today]);

            // 2. Actualizar misiones de "spend_time"
            const timeResult = await client.query(`
                WITH time_spent AS (
                    SELECT
                        uam.user_id,
                        SUM(uam.time_spent_minutes) as total_time
                    FROM user_activity_metrics uam
                    WHERE uam.metric_date = $1
                    GROUP BY uam.user_id
                )
                UPDATE user_daily_quests uq
                SET current_progress = LEAST(ts.total_time, uq.target_value)
                FROM daily_quest_templates t, time_spent ts
                WHERE uq.template_id = t.id
                AND t.quest_type = 'spend_time'
                AND uq.user_id = ts.user_id
                AND uq.quest_date = $1
                AND uq.status = 'active'
            `, [today]);

            console.log(`📊 Progreso automático actualizado:`);
            console.log(`   - Logins: ${loginResult.rowCount} misiones`);
            console.log(`   - Tiempo: ${timeResult.rowCount} misiones`);

        } finally {
            client.release();
        }
    }

    /**
     * Verifica si los usuarios activos tienen misiones hoy, y las genera si no
     */
    async checkAndGenerateInitialQuests() {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Contar usuarios activos sin misiones para hoy
            const result = await pool.query(`
                SELECT COUNT(DISTINCT u.id) as count
                FROM users u
                WHERE (
                    EXISTS (
                        SELECT 1 FROM user_activity_metrics uam
                        WHERE uam.user_id = u.id
                        AND uam.last_activity >= NOW() - INTERVAL '7 days'
                    )
                    OR EXISTS (
                        SELECT 1 FROM user_sessions us
                        WHERE us.user_id = u.id
                        AND us.created_at >= NOW() - INTERVAL '7 days'
                    )
                )
                AND NOT EXISTS (
                    SELECT 1 FROM user_daily_quests uq
                    WHERE uq.user_id = u.id
                    AND uq.quest_date = $1
                )
            `, [today]);

            const usersWithoutQuests = parseInt(result.rows[0].count);

            if (usersWithoutQuests > 0) {
                console.log(`⚠️  ${usersWithoutQuests} usuarios activos sin misiones para hoy`);
                console.log('🔄 Generando misiones iniciales...');

                const generated = await this.generateDailyQuests();

                console.log(`✅ Generación inicial completada: ${generated.questsGenerated} misiones`);
            } else {
                console.log('✅ Todos los usuarios activos tienen misiones para hoy');
            }
        } catch (error) {
            console.error('Error en verificación inicial:', error);
        }
    }

    /**
     * Obtiene estadísticas del sistema
     */
    async getSystemStats() {
        try {
            const result = await pool.query(`
                SELECT
                    COUNT(DISTINCT user_id) as active_users_today,
                    COUNT(*) FILTER (WHERE status = 'active') as active_quests,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_today,
                    COUNT(*) FILTER (WHERE status = 'expired') as expired_today,
                    AVG(current_progress::DECIMAL / NULLIF(target_value, 0) * 100) FILTER (WHERE status = 'active') as avg_progress_percent
                FROM user_daily_quests
                WHERE quest_date = CURRENT_DATE
            `);

            return result.rows[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

module.exports = DailyQuestsScheduler;
