const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// SISTEMA DE MISIONES DIARIAS AUTOMÁTICAS
// =====================================================

// Obtener misiones activas del usuario para hoy
router.get('/my-quests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(`
            SELECT
                uq.id,
                uq.user_id,
                uq.quest_date,
                uq.target_value,
                uq.current_progress,
                uq.status,
                uq.started_at,
                uq.completed_at,
                uq.bonus_earned,
                uq.reward_claimed,
                t.quest_code,
                t.quest_name,
                t.quest_description,
                t.quest_type,
                t.difficulty,
                t.reward_luminarias,
                t.bonus_luminarias,
                t.bonus_condition_hours,
                t.icon,
                t.color,
                ROUND((uq.current_progress::DECIMAL / uq.target_value) * 100, 2) as progress_percentage,
                CASE
                    WHEN uq.status = 'completed' AND uq.bonus_earned THEN t.reward_luminarias + t.bonus_luminarias
                    WHEN uq.status = 'completed' THEN t.reward_luminarias
                    ELSE 0
                END as total_reward
            FROM user_daily_quests uq
            JOIN daily_quest_templates t ON t.id = uq.template_id
            WHERE uq.user_id = $1
            AND uq.quest_date = CURRENT_DATE
            ORDER BY t.difficulty ASC, uq.status DESC
        `, [userId]);

        res.json({
            success: true,
            quests: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching daily quests:', error);
        res.status(500).json({ error: 'Error al obtener misiones diarias' });
    }
});

// Obtener estadísticas de misiones del usuario
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(`
            SELECT
                total_quests_completed,
                total_quests_failed,
                current_streak_days,
                longest_streak_days,
                total_luminarias_earned,
                total_bonus_earned,
                last_completion_date,
                created_at,
                updated_at
            FROM daily_quest_stats
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                stats: {
                    total_quests_completed: 0,
                    total_quests_failed: 0,
                    current_streak_days: 0,
                    longest_streak_days: 0,
                    total_luminarias_earned: 0,
                    total_bonus_earned: 0,
                    last_completion_date: null,
                    completion_rate: 0
                }
            });
        }

        const stats = result.rows[0];
        const totalQuests = stats.total_quests_completed + stats.total_quests_failed;
        const completionRate = totalQuests > 0
            ? ((stats.total_quests_completed / totalQuests) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            stats: {
                ...stats,
                completion_rate: parseFloat(completionRate)
            }
        });
    } catch (error) {
        console.error('Error fetching quest stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas de misiones' });
    }
});

// Actualizar progreso de una misión
router.post('/update-progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { questType, activityData, progressIncrement = 1 } = req.body;

        // Obtener misiones activas del usuario de este tipo
        const questsResult = await pool.query(`
            SELECT uq.id, uq.current_progress, uq.target_value, t.quest_type
            FROM user_daily_quests uq
            JOIN daily_quest_templates t ON t.id = uq.template_id
            WHERE uq.user_id = $1
            AND uq.quest_date = CURRENT_DATE
            AND uq.status = 'active'
            AND t.quest_type = $2
        `, [userId, questType]);

        if (questsResult.rows.length === 0) {
            return res.json({
                success: true,
                message: 'No hay misiones activas de este tipo',
                updated: 0
            });
        }

        const client = await pool.connect();
        const updatedQuests = [];

        try {
            await client.query('BEGIN');

            for (const quest of questsResult.rows) {
                const newProgress = quest.current_progress + progressIncrement;

                // Actualizar progreso
                await client.query(`
                    UPDATE user_daily_quests
                    SET current_progress = LEAST($1, target_value)
                    WHERE id = $2
                `, [newProgress, quest.id]);

                // Registrar actividad
                await client.query(`
                    INSERT INTO daily_quest_progress (user_quest_id, activity_type, activity_data, progress_increment)
                    VALUES ($1, $2, $3, $4)
                `, [quest.id, questType, JSON.stringify(activityData || {}), progressIncrement]);

                updatedQuests.push({
                    questId: quest.id,
                    previousProgress: quest.current_progress,
                    newProgress: Math.min(newProgress, quest.target_value),
                    completed: newProgress >= quest.target_value
                });
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Progreso actualizado',
                updated: updatedQuests.length,
                quests: updatedQuests
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating quest progress:', error);
        res.status(500).json({ error: 'Error al actualizar progreso de misión' });
    }
});

// Reclamar recompensa de una misión completada
router.post('/claim-reward/:questId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const questId = parseInt(req.params.questId);

        // Verificar que la misión pertenece al usuario
        const checkResult = await pool.query(`
            SELECT user_id, status, reward_claimed
            FROM user_daily_quests
            WHERE id = $1
        `, [questId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Misión no encontrada' });
        }

        const quest = checkResult.rows[0];

        if (quest.user_id !== userId) {
            return res.status(403).json({ error: 'Esta misión no te pertenece' });
        }

        if (quest.status !== 'completed') {
            return res.status(400).json({ error: 'La misión no está completada' });
        }

        if (quest.reward_claimed) {
            return res.status(400).json({ error: 'Recompensa ya reclamada' });
        }

        // Reclamar recompensa usando función de base de datos
        const result = await pool.query(`
            SELECT * FROM claim_daily_quest_reward($1)
        `, [questId]);

        const claimResult = result.rows[0];

        if (claimResult.success) {
            res.json({
                success: true,
                message: claimResult.message,
                luminarias_earned: claimResult.luminarias_earned,
                bonus_earned: claimResult.bonus_earned,
                total_earned: claimResult.luminarias_earned + claimResult.bonus_earned
            });
        } else {
            res.status(400).json({
                success: false,
                error: claimResult.message
            });
        }
    } catch (error) {
        console.error('Error claiming quest reward:', error);
        res.status(500).json({ error: 'Error al reclamar recompensa' });
    }
});

// Obtener historial de misiones completadas
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 30, offset = 0 } = req.query;

        const result = await pool.query(`
            SELECT
                uq.id,
                uq.quest_date,
                uq.completed_at,
                uq.bonus_earned,
                t.quest_name,
                t.quest_description,
                t.icon,
                t.reward_luminarias,
                t.bonus_luminarias,
                CASE
                    WHEN uq.bonus_earned THEN t.reward_luminarias + t.bonus_luminarias
                    ELSE t.reward_luminarias
                END as total_earned
            FROM user_daily_quests uq
            JOIN daily_quest_templates t ON t.id = uq.template_id
            WHERE uq.user_id = $1
            AND uq.status = 'completed'
            ORDER BY uq.completed_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        const countResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM user_daily_quests
            WHERE user_id = $1 AND status = 'completed'
        `, [userId]);

        res.json({
            success: true,
            history: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching quest history:', error);
        res.status(500).json({ error: 'Error al obtener historial de misiones' });
    }
});

// =====================================================
// ENDPOINTS ADMINISTRATIVOS
// =====================================================

// Generar misiones para un usuario específico (admin/sistema)
router.post('/generate-for-user/:userId', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const targetUserId = parseInt(req.params.userId);
        const { date = new Date().toISOString().split('T')[0] } = req.body;

        const generated = await generateDailyQuestsForUser(targetUserId, date);

        res.json({
            success: true,
            message: 'Misiones generadas',
            generated: generated.length,
            quests: generated
        });
    } catch (error) {
        console.error('Error generating quests:', error);
        res.status(500).json({ error: 'Error al generar misiones' });
    }
});

// Generar misiones para todos los usuarios activos (cron job)
router.post('/generate-daily-batch', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const result = await generateDailyQuestsForAllUsers();

        res.json({
            success: true,
            message: 'Generación masiva completada',
            users_processed: result.usersProcessed,
            quests_generated: result.questsGenerated
        });
    } catch (error) {
        console.error('Error in batch generation:', error);
        res.status(500).json({ error: 'Error en generación masiva' });
    }
});

// Expirar misiones antiguas (cron job)
router.post('/expire-old-quests', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const result = await pool.query('SELECT expire_old_daily_quests()');
        const expiredCount = result.rows[0].expire_old_daily_quests;

        res.json({
            success: true,
            message: 'Misiones expiradas',
            expired_count: expiredCount
        });
    } catch (error) {
        console.error('Error expiring quests:', error);
        res.status(500).json({ error: 'Error al expirar misiones' });
    }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function generateDailyQuestsForUser(userId, date = null) {
    const questDate = date || new Date().toISOString().split('T')[0];

    // Verificar si ya tiene misiones para hoy
    const existing = await pool.query(`
        SELECT id FROM user_daily_quests
        WHERE user_id = $1 AND quest_date = $2
    `, [userId, questDate]);

    if (existing.rows.length > 0) {
        return []; // Ya tiene misiones
    }

    // Seleccionar 3 misiones: 1 fácil, 1 media, 1 difícil
    const difficulties = ['easy', 'medium', 'hard'];
    const selectedQuests = [];

    for (const difficulty of difficulties) {
        const result = await pool.query(`
            SELECT id, quest_type, target_value
            FROM daily_quest_templates
            WHERE difficulty = $1 AND is_active = TRUE
            ORDER BY RANDOM() * weight DESC
            LIMIT 1
        `, [difficulty]);

        if (result.rows.length > 0) {
            const template = result.rows[0];

            // Insertar misión para el usuario
            const insertResult = await pool.query(`
                INSERT INTO user_daily_quests (user_id, template_id, quest_date, target_value)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, [userId, template.id, questDate, template.target_value]);

            selectedQuests.push({
                questId: insertResult.rows[0].id,
                templateId: template.id,
                difficulty,
                questType: template.quest_type
            });
        }
    }

    return selectedQuests;
}

async function generateDailyQuestsForAllUsers() {
    // Obtener usuarios activos (con actividad en últimos 30 días)
    const usersResult = await pool.query(`
        SELECT DISTINCT u.id
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

    let usersProcessed = 0;
    let questsGenerated = 0;

    for (const user of usersResult.rows) {
        const quests = await generateDailyQuestsForUser(user.id);
        if (quests.length > 0) {
            usersProcessed++;
            questsGenerated += quests.length;
        }
    }

    return { usersProcessed, questsGenerated };
}

module.exports = router;
