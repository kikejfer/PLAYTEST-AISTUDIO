const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// SISTEMA DE REPETICIÓN ESPACIADA (SPACED REPETITION)
// =====================================================

// Obtener preguntas pendientes de revisión para hoy
router.get('/review-queue', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { blockId, limit = 20, includeNew = true } = req.query;

        let whereConditions = [
            'srq.user_id = $1',
            'srq.next_review_date <= NOW()'
        ];

        let params = [userId];
        let paramCount = 1;

        if (blockId) {
            paramCount++;
            whereConditions.push(`srq.block_id = $${paramCount}`);
            params.push(parseInt(blockId));
        }

        // Si includeNew, también traer preguntas nuevas que no están en la cola
        const result = await pool.query(`
            SELECT
                srq.id as queue_id,
                q.id as question_id,
                q.texto_pregunta,
                q.tema,
                q.difficulty,
                b.name as block_name,
                srq.status,
                srq.interval_days,
                srq.ease_factor,
                srq.consecutive_correct,
                srq.total_reviews,
                srq.total_correct,
                srq.total_incorrect,
                srq.next_review_date,
                srq.last_reviewed_at,
                ROUND((srq.total_correct::DECIMAL / NULLIF(srq.total_reviews, 0)) * 100, 2) as accuracy_percent
            FROM spaced_repetition_queue srq
            JOIN questions q ON q.id = srq.question_id
            JOIN blocks b ON b.id = srq.block_id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY srq.next_review_date ASC, srq.status DESC
            LIMIT $${paramCount + 1}
        `, [...params, limit]);

        res.json({
            success: true,
            queue: result.rows,
            count: result.rows.length,
            due_now: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching review queue:', error);
        res.status(500).json({ error: 'Error al obtener cola de revisión' });
    }
});

// Obtener preguntas nuevas para aprender
router.get('/new-cards', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { blockId, limit = 10 } = req.query;

        // Obtener preguntas del bloque que el usuario NO tiene en su cola
        let whereConditions = ['b.id = $1'];
        let params = [blockId];

        const result = await pool.query(`
            SELECT
                q.id as question_id,
                q.texto_pregunta,
                q.tema,
                q.difficulty,
                b.name as block_name
            FROM questions q
            JOIN blocks b ON b.id = q.block_id
            WHERE ${whereConditions.join(' AND ')}
            AND NOT EXISTS (
                SELECT 1 FROM spaced_repetition_queue srq
                WHERE srq.user_id = $2 AND srq.question_id = q.id
            )
            ORDER BY RANDOM()
            LIMIT $3
        `, [...params, userId, limit]);

        res.json({
            success: true,
            newCards: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching new cards:', error);
        res.status(500).json({ error: 'Error al obtener preguntas nuevas' });
    }
});

// Procesar una revisión
router.post('/review', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            questionId,
            wasCorrect,
            responseTimeSeconds,
            confidenceRating
        } = req.body;

        if (!questionId || typeof wasCorrect !== 'boolean') {
            return res.status(400).json({
                error: 'questionId y wasCorrect son requeridos'
            });
        }

        // Procesar revisión usando función de base de datos
        const result = await pool.query(`
            SELECT * FROM process_spaced_repetition_review($1, $2, $3, $4, $5)
        `, [
            userId,
            questionId,
            wasCorrect,
            responseTimeSeconds || null,
            confidenceRating || null
        ]);

        const reviewResult = result.rows[0];

        if (reviewResult.success) {
            // Actualizar progreso de daily quest si existe
            if (global.updateDailyQuestProgress) {
                await global.updateDailyQuestProgress(userId, 'answer_questions', {
                    questionId,
                    wasCorrect
                });
            }

            res.json({
                success: true,
                nextReviewDate: reviewResult.next_review_date,
                newInterval: reviewResult.new_interval,
                newStatus: reviewResult.new_status,
                message: wasCorrect
                    ? `¡Correcto! Próxima revisión en ${reviewResult.new_interval} día(s)`
                    : 'Respuesta incorrecta. Revisaremos pronto.'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error al procesar revisión'
            });
        }
    } catch (error) {
        console.error('Error processing review:', error);
        res.status(500).json({ error: 'Error al procesar revisión' });
    }
});

// Obtener estadísticas de SR del usuario
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Estadísticas generales
        const generalStats = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'new') as new_count,
                COUNT(*) FILTER (WHERE status = 'learning') as learning_count,
                COUNT(*) FILTER (WHERE status = 'review') as review_count,
                COUNT(*) FILTER (WHERE status = 'mastered') as mastered_count,
                COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_today,
                COUNT(*) as total_cards,
                AVG(ease_factor) as avg_ease_factor,
                ROUND(AVG(total_correct::DECIMAL / NULLIF(total_reviews, 0)) * 100, 2) as avg_accuracy
            FROM spaced_repetition_queue
            WHERE user_id = $1
        `, [userId]);

        // Estadísticas de hoy
        const todayStats = await pool.query(`
            SELECT
                new_cards_seen,
                reviews_completed,
                correct_reviews,
                incorrect_reviews,
                cards_mastered,
                total_study_time_seconds,
                ROUND((correct_reviews::DECIMAL / NULLIF(reviews_completed, 0)) * 100, 2) as accuracy_today
            FROM spaced_repetition_daily_stats
            WHERE user_id = $1 AND stat_date = CURRENT_DATE
        `, [userId]);

        // Estadísticas de últimos 7 días
        const weekStats = await pool.query(`
            SELECT
                SUM(reviews_completed) as total_reviews,
                SUM(correct_reviews) as total_correct,
                SUM(cards_mastered) as total_mastered,
                SUM(total_study_time_seconds) as total_time,
                ROUND(AVG(correct_reviews::DECIMAL / NULLIF(reviews_completed, 0)) * 100, 2) as avg_accuracy
            FROM spaced_repetition_daily_stats
            WHERE user_id = $1
            AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
        `, [userId]);

        res.json({
            success: true,
            general: generalStats.rows[0],
            today: todayStats.rows[0] || {
                new_cards_seen: 0,
                reviews_completed: 0,
                correct_reviews: 0,
                incorrect_reviews: 0,
                cards_mastered: 0,
                total_study_time_seconds: 0,
                accuracy_today: 0
            },
            week: weekStats.rows[0]
        });
    } catch (error) {
        console.error('Error fetching SR stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Obtener historial de revisiones
router.get('/review-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0, questionId } = req.query;

        let whereConditions = ['srr.user_id = $1'];
        let params = [userId];

        if (questionId) {
            params.push(questionId);
            whereConditions.push(`srr.question_id = $${params.length}`);
        }

        const result = await pool.query(`
            SELECT
                srr.id,
                srr.question_id,
                q.texto_pregunta,
                srr.was_correct,
                srr.response_time_seconds,
                srr.confidence_rating,
                srr.interval_before,
                srr.interval_after,
                srr.ease_factor_before,
                srr.ease_factor_after,
                srr.next_review_date,
                srr.reviewed_at
            FROM spaced_repetition_reviews srr
            JOIN questions q ON q.id = srr.question_id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY srr.reviewed_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        res.json({
            success: true,
            history: result.rows,
            count: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching review history:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// Obtener configuración del usuario
router.get('/config', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(`
            SELECT *
            FROM spaced_repetition_config
            WHERE user_id = $1 OR user_id IS NULL
            ORDER BY user_id DESC NULLS LAST
            LIMIT 1
        `, [userId]);

        res.json({
            success: true,
            config: result.rows[0] || {}
        });
    } catch (error) {
        console.error('Error fetching SR config:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// Actualizar configuración del usuario
router.put('/config', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            maxReviewsPerDay,
            maxNewPerDay,
            masteryThreshold
        } = req.body;

        const result = await pool.query(`
            INSERT INTO spaced_repetition_config (
                user_id,
                max_reviews_per_day,
                max_new_per_day,
                mastery_threshold
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET
                max_reviews_per_day = COALESCE($2, spaced_repetition_config.max_reviews_per_day),
                max_new_per_day = COALESCE($3, spaced_repetition_config.max_new_per_day),
                mastery_threshold = COALESCE($4, spaced_repetition_config.mastery_threshold),
                updated_at = NOW()
            RETURNING *
        `, [userId, maxReviewsPerDay, maxNewPerDay, masteryThreshold]);

        res.json({
            success: true,
            config: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating SR config:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// Dashboard: Resumen para interfaz
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Resumen del día
        const summary = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE next_review_date <= NOW()) as due_now,
                COUNT(*) FILTER (WHERE next_review_date <= NOW() + INTERVAL '1 day') as due_tomorrow,
                COUNT(*) FILTER (WHERE status = 'new') as new_available
            FROM spaced_repetition_queue
            WHERE user_id = $1
        `, [userId]);

        // Progreso de hoy
        const todayProgress = await pool.query(`
            SELECT
                reviews_completed,
                correct_reviews,
                COALESCE((SELECT max_reviews_per_day FROM spaced_repetition_config WHERE user_id = $1 OR user_id IS NULL ORDER BY user_id DESC NULLS LAST LIMIT 1), 50) as daily_goal
            FROM spaced_repetition_daily_stats
            WHERE user_id = $1 AND stat_date = CURRENT_DATE
        `, [userId]);

        const progress = todayProgress.rows[0] || {
            reviews_completed: 0,
            correct_reviews: 0,
            daily_goal: 50
        };

        res.json({
            success: true,
            summary: summary.rows[0],
            todayProgress: {
                ...progress,
                percentComplete: Math.round((progress.reviews_completed / progress.daily_goal) * 100)
            }
        });
    } catch (error) {
        console.error('Error fetching SR dashboard:', error);
        res.status(500).json({ error: 'Error al obtener dashboard' });
    }
});

module.exports = router;
