const cron = require('node-cron');
const { pool } = require('../database/connection');
const pushService = require('../services/push-notifications');

// =====================================================
// CRON JOBS PARA NOTIFICACIONES PUSH AUTOMÁTICAS
// =====================================================

class PushNotificationScheduler {
    constructor() {
        this.isRunning = false;
        this.jobs = [];
    }

    start() {
        if (!pushService.enabled) {
            console.log('📵 Notificaciones push deshabilitadas, scheduler no iniciado');
            return;
        }

        console.log('📲 Iniciando sistema de notificaciones push automáticas...');

        // Job 1: Recordatorios de racha (22:00 todos los días)
        const streakReminderJob = cron.schedule('0 22 * * *', async () => {
            console.log('🔥 [Push] Enviando recordatorios de racha...');
            try {
                await this.sendStreakReminders();
            } catch (error) {
                console.error('❌ [Push] Error enviando recordatorios de racha:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        // Job 2: Nuevas misiones disponibles (08:00 todos los días)
        const questAvailableJob = cron.schedule('0 8 * * *', async () => {
            console.log('🎯 [Push] Notificando nuevas misiones diarias...');
            try {
                await this.sendQuestAvailableNotifications();
            } catch (error) {
                console.error('❌ [Push] Error notificando misiones:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        // Job 3: Misiones próximas a expirar (20:00 todos los días)
        const questExpiringJob = cron.schedule('0 20 * * *', async () => {
            console.log('⏰ [Push] Notificando misiones por expirar...');
            try {
                await this.sendQuestExpiringNotifications();
            } catch (error) {
                console.error('❌ [Push] Error notificando expiración:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        // Job 4: Usuarios inactivos - Reactivación (10:00 todos los lunes)
        const comebackJob = cron.schedule('0 10 * * 1', async () => {
            console.log('👋 [Push] Enviando recordatorios a usuarios inactivos...');
            try {
                await this.sendComebackNotifications();
            } catch (error) {
                console.error('❌ [Push] Error en recordatorios de regreso:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        this.jobs.push(streakReminderJob, questAvailableJob, questExpiringJob, comebackJob);
        this.isRunning = true;

        console.log('✅ Sistema de notificaciones push automáticas iniciado');
        console.log('   - Recordatorios de racha: 22:00');
        console.log('   - Nuevas misiones: 08:00');
        console.log('   - Misiones por expirar: 20:00');
        console.log('   - Usuarios inactivos: Lunes 10:00');
    }

    stop() {
        this.jobs.forEach(job => job.stop());
        this.isRunning = false;
        console.log('⏹️  Sistema de notificaciones push detenido');
    }

    /**
     * Envía recordatorios de racha a usuarios que no han estudiado hoy
     */
    async sendStreakReminders() {
        try {
            // Obtener usuarios con racha activa que no han estudiado hoy
            const result = await pool.query(`
                SELECT DISTINCT u.id
                FROM users u
                JOIN rachas_estudio re ON re.alumno_id = u.id
                WHERE re.racha_actual >= 3  -- Solo si tienen racha >= 3 días
                AND re.ultima_actividad < CURRENT_DATE  -- No han estudiado hoy
                AND EXISTS (
                    SELECT 1 FROM user_push_tokens upt
                    WHERE upt.user_id = u.id AND upt.is_active = TRUE
                )
            `);

            let sent = 0;
            for (const user of result.rows) {
                const success = await pushService.sendStreakReminder(user.id);
                if (success.success) sent++;
            }

            console.log(`📊 Recordatorios de racha enviados: ${sent}/${result.rows.length}`);
            return sent;
        } catch (error) {
            console.error('Error enviando recordatorios de racha:', error);
            throw error;
        }
    }

    /**
     * Notifica que hay nuevas misiones diarias disponibles
     */
    async sendQuestAvailableNotifications() {
        try {
            // Obtener usuarios con dispositivos activos y misiones nuevas hoy
            const result = await pool.query(`
                SELECT DISTINCT uq.user_id
                FROM user_daily_quests uq
                JOIN user_push_tokens upt ON upt.user_id = uq.user_id
                WHERE uq.quest_date = CURRENT_DATE
                AND uq.status = 'active'
                AND upt.is_active = TRUE
                GROUP BY uq.user_id
                HAVING COUNT(*) > 0
            `);

            let sent = 0;
            for (const user of result.rows) {
                const success = await pushService.sendQuestAvailable(user.user_id);
                if (success.success) sent++;
            }

            console.log(`📊 Notificaciones de misiones disponibles: ${sent}/${result.rows.length}`);
            return sent;
        } catch (error) {
            console.error('Error notificando misiones disponibles:', error);
            throw error;
        }
    }

    /**
     * Notifica misiones que expiran en menos de 4 horas
     */
    async sendQuestExpiringNotifications() {
        try {
            // Obtener misiones activas que aún no están completadas
            const result = await pool.query(`
                SELECT
                    uq.user_id,
                    t.quest_name,
                    EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '1 day' - NOW())) / 3600 as hours_left
                FROM user_daily_quests uq
                JOIN daily_quest_templates t ON t.id = uq.template_id
                JOIN user_push_tokens upt ON upt.user_id = uq.user_id
                WHERE uq.quest_date = CURRENT_DATE
                AND uq.status = 'active'
                AND uq.current_progress < uq.target_value
                AND upt.is_active = TRUE
            `);

            let sent = 0;
            for (const quest of result.rows) {
                const success = await pushService.sendQuestExpiring(
                    quest.user_id,
                    quest.quest_name,
                    Math.ceil(quest.hours_left)
                );
                if (success.success) sent++;
            }

            console.log(`📊 Notificaciones de misiones por expirar: ${sent}/${result.rows.length}`);
            return sent;
        } catch (error) {
            console.error('Error notificando expiración de misiones:', error);
            throw error;
        }
    }

    /**
     * Envía notificaciones de regreso a usuarios inactivos por 3+ días
     */
    async sendComebackNotifications() {
        try {
            // Obtener usuarios inactivos con dispositivos registrados
            const result = await pool.query(`
                SELECT
                    u.id as user_id,
                    CURRENT_DATE - MAX(uam.last_activity::DATE) as days_inactive
                FROM users u
                JOIN user_activity_metrics uam ON uam.user_id = u.id
                JOIN user_push_tokens upt ON upt.user_id = u.id
                WHERE upt.is_active = TRUE
                GROUP BY u.id
                HAVING CURRENT_DATE - MAX(uam.last_activity::DATE) >= 3
                AND CURRENT_DATE - MAX(uam.last_activity::DATE) <= 14  -- Solo entre 3-14 días
            `);

            let sent = 0;
            for (const user of result.rows) {
                const success = await pushService.sendInactiveReminder(
                    user.user_id,
                    user.days_inactive
                );
                if (success.success) sent++;
            }

            console.log(`📊 Notificaciones de regreso enviadas: ${sent}/${result.rows.length}`);
            return sent;
        } catch (error) {
            console.error('Error enviando notificaciones de regreso:', error);
            throw error;
        }
    }

    /**
     * Envía notificaciones programadas pendientes
     */
    async processPendingScheduledNotifications() {
        try {
            const result = await pool.query(`
                SELECT id, user_id, notification_title, notification_body, notification_data
                FROM scheduled_push_notifications
                WHERE sent = FALSE
                AND scheduled_for <= NOW()
                LIMIT 100
            `);

            let sent = 0;
            for (const notification of result.rows) {
                const success = await pushService.sendToUser(notification.user_id, {
                    title: notification.notification_title,
                    body: notification.notification_body,
                    data: notification.notification_data
                });

                if (success.success) {
                    await pool.query(`
                        UPDATE scheduled_push_notifications
                        SET sent = TRUE, sent_at = NOW()
                        WHERE id = $1
                    `, [notification.id]);
                    sent++;
                }
            }

            if (sent > 0) {
                console.log(`📊 Notificaciones programadas enviadas: ${sent}/${result.rows.length}`);
            }

            return sent;
        } catch (error) {
            console.error('Error procesando notificaciones programadas:', error);
            throw error;
        }
    }
}

module.exports = PushNotificationScheduler;
