const { pool } = require('../database/connection');

// =====================================================
// SISTEMA DE DIFICULTAD ADAPTATIVA AUTOMÁTICA
// =====================================================
// Ajusta la dificultad de preguntas basándose en el rendimiento del usuario
// =====================================================

class AdaptiveDifficultyService {
    constructor() {
        this.difficultyLevels = {
            1: 'Muy Fácil',
            2: 'Fácil',
            3: 'Medio',
            4: 'Difícil',
            5: 'Muy Difícil'
        };
    }

    /**
     * Calcula el nivel de dificultad recomendado para un usuario en un bloque
     */
    async getRecommendedDifficulty(userId, blockId) {
        try {
            // Obtener rendimiento reciente del usuario en este bloque
            const result = await pool.query(`
                WITH recent_performance AS (
                    SELECT
                        q.difficulty,
                        COUNT(*) as attempts,
                        SUM(CASE WHEN a.es_correcta THEN 1 ELSE 0 END) as correct,
                        AVG(CASE WHEN a.es_correcta THEN 100 ELSE 0 END) as accuracy
                    FROM game_scores gs
                    JOIN questions q ON q.id = gs.question_id
                    JOIN answers a ON a.id = gs.selected_answer_id
                    WHERE gs.user_id = $1
                    AND q.block_id = $2
                    AND gs.created_at >= NOW() - INTERVAL '7 days'  -- Últimos 7 días
                    GROUP BY q.difficulty
                )
                SELECT
                    difficulty,
                    attempts,
                    correct,
                    ROUND(accuracy, 2) as accuracy_percent
                FROM recent_performance
                ORDER BY attempts DESC
            `, [userId, blockId]);

            if (result.rows.length === 0) {
                // Sin historial, empezar en nivel medio
                return {
                    recommended_difficulty: 3,
                    reason: 'Sin historial previo, comenzando en nivel medio',
                    confidence: 'low'
                };
            }

            // Calcular accuracy promedio ponderada por intentos
            let totalAttempts = 0;
            let weightedAccuracy = 0;
            let currentDifficulty = 3;

            for (const row of result.rows) {
                totalAttempts += row.attempts;
                weightedAccuracy += row.accuracy_percent * row.attempts;
                if (row.attempts > totalAttempts * 0.3) {
                    // El nivel con más intentos
                    currentDifficulty = row.difficulty;
                }
            }

            const avgAccuracy = weightedAccuracy / totalAttempts;

            // Determinar ajuste de dificultad
            let newDifficulty = currentDifficulty;
            let reason = '';

            if (avgAccuracy >= 90) {
                newDifficulty = Math.min(currentDifficulty + 2, 5);
                reason = 'Rendimiento excelente (>90%), aumentando dificultad significativamente';
            } else if (avgAccuracy >= 80) {
                newDifficulty = Math.min(currentDifficulty + 1, 5);
                reason = 'Buen rendimiento (>80%), aumentando dificultad';
            } else if (avgAccuracy >= 60) {
                newDifficulty = currentDifficulty;
                reason = 'Rendimiento adecuado (60-80%), manteniendo dificultad';
            } else if (avgAccuracy >= 40) {
                newDifficulty = Math.max(currentDifficulty - 1, 1);
                reason = 'Rendimiento bajo (40-60%), reduciendo dificultad';
            } else {
                newDifficulty = Math.max(currentDifficulty - 2, 1);
                reason = 'Rendimiento muy bajo (<40%), reduciendo dificultad significativamente';
            }

            return {
                recommended_difficulty: newDifficulty,
                current_accuracy: Math.round(avgAccuracy),
                previous_difficulty: currentDifficulty,
                reason,
                confidence: totalAttempts >= 20 ? 'high' : totalAttempts >= 10 ? 'medium' : 'low',
                total_attempts: totalAttempts
            };
        } catch (error) {
            console.error('Error calculating recommended difficulty:', error);
            return {
                recommended_difficulty: 3,
                reason: 'Error al calcular, usando nivel medio por defecto',
                confidence: 'low'
            };
        }
    }

    /**
     * Obtiene preguntas adaptadas a la dificultad recomendada para el usuario
     */
    async getAdaptiveQuestions(userId, blockId, count = 10, topics = null) {
        try {
            // Obtener dificultad recomendada
            const difficultyInfo = await this.getRecommendedDifficulty(userId, blockId);
            const targetDifficulty = difficultyInfo.recommended_difficulty;

            // Construir rango de dificultad (±1 nivel para variedad)
            const minDifficulty = Math.max(targetDifficulty - 1, 1);
            const maxDifficulty = Math.min(targetDifficulty + 1, 5);

            let whereConditions = [
                'q.block_id = $1',
                'q.difficulty BETWEEN $2 AND $3'
            ];
            let params = [blockId, minDifficulty, maxDifficulty];

            // Filtrar por temas si se especifican
            if (topics && topics.length > 0) {
                params.push(topics);
                whereConditions.push(`q.tema = ANY($${params.length})`);
            }

            // Priorizar preguntas no vistas recientemente
            const result = await pool.query(`
                WITH question_pool AS (
                    SELECT
                        q.id,
                        q.texto_pregunta,
                        q.tema,
                        q.difficulty,
                        q.explicacion_respuesta,
                        MAX(gs.created_at) as last_seen,
                        COUNT(gs.id) as times_seen
                    FROM questions q
                    LEFT JOIN game_scores gs ON gs.question_id = q.id AND gs.user_id = $4
                    WHERE ${whereConditions.join(' AND ')}
                    GROUP BY q.id
                )
                SELECT *
                FROM question_pool
                ORDER BY
                    -- Priorizar preguntas nunca vistas
                    CASE WHEN last_seen IS NULL THEN 0 ELSE 1 END,
                    -- Luego por antigüedad
                    last_seen ASC NULLS FIRST,
                    -- Finalmente aleatorio con peso en dificultad objetivo
                    RANDOM() * (1 + ABS(difficulty - $2)::DECIMAL)
                LIMIT $5
            `, [...params, userId, count]);

            return {
                questions: result.rows,
                difficulty_info: difficultyInfo,
                target_difficulty: targetDifficulty,
                difficulty_range: `${minDifficulty}-${maxDifficulty}`
            };
        } catch (error) {
            console.error('Error getting adaptive questions:', error);
            throw error;
        }
    }

    /**
     * Actualiza la configuración de dificultad adaptativa del usuario
     */
    async updateUserAdaptiveSettings(userId, blockId, settings) {
        try {
            const {
                enableAdaptive = true,
                targetAccuracy = 75,
                minDifficulty = 1,
                maxDifficulty = 5
            } = settings;

            await pool.query(`
                INSERT INTO user_adaptive_difficulty (
                    user_id,
                    block_id,
                    enabled,
                    target_accuracy,
                    min_difficulty,
                    max_difficulty
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, block_id)
                DO UPDATE SET
                    enabled = $3,
                    target_accuracy = $4,
                    min_difficulty = $5,
                    max_difficulty = $6,
                    updated_at = NOW()
            `, [userId, blockId, enableAdaptive, targetAccuracy, minDifficulty, maxDifficulty]);

            return true;
        } catch (error) {
            console.error('Error updating adaptive settings:', error);
            return false;
        }
    }

    /**
     * Registra el resultado de una pregunta para ajustar dificultad
     */
    async recordQuestionResult(userId, questionId, wasCorrect, responseTime) {
        try {
            // Registrar en tabla de resultados
            await pool.query(`
                INSERT INTO adaptive_difficulty_results (
                    user_id,
                    question_id,
                    was_correct,
                    response_time_seconds
                )
                VALUES ($1, $2, $3, $4)
            `, [userId, questionId, wasCorrect, responseTime]);

            return true;
        } catch (error) {
            console.error('Error recording question result:', error);
            return false;
        }
    }

    /**
     * Obtiene estadísticas de rendimiento por dificultad
     */
    async getPerformanceByDifficulty(userId, blockId) {
        try {
            const result = await pool.query(`
                SELECT
                    q.difficulty,
                    COUNT(*) as total_attempts,
                    SUM(CASE WHEN a.es_correcta THEN 1 ELSE 0 END) as correct_attempts,
                    ROUND(AVG(CASE WHEN a.es_correcta THEN 100 ELSE 0 END), 2) as accuracy_percent,
                    ROUND(AVG(gs.time_taken), 2) as avg_time_seconds
                FROM game_scores gs
                JOIN questions q ON q.id = gs.question_id
                JOIN answers a ON a.id = gs.selected_answer_id
                WHERE gs.user_id = $1
                AND q.block_id = $2
                GROUP BY q.difficulty
                ORDER BY q.difficulty ASC
            `, [userId, blockId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting performance by difficulty:', error);
            return [];
        }
    }
}

module.exports = new AdaptiveDifficultyService();
