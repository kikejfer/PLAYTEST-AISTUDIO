const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const adaptiveDifficultyService = require('../services/adaptive-difficulty');

// =====================================================
// SISTEMA DE DIFICULTAD ADAPTATIVA
// =====================================================

// Obtener dificultad recomendada para un bloque
router.get('/recommended/:blockId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const blockId = parseInt(req.params.blockId);

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(userId, blockId);

        res.json({
            success: true,
            ...recommendation
        });
    } catch (error) {
        console.error('Error getting recommended difficulty:', error);
        res.status(500).json({ error: 'Error al obtener dificultad recomendada' });
    }
});

// Obtener preguntas adaptadas a la dificultad del usuario
router.get('/questions/:blockId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const blockId = parseInt(req.params.blockId);
        const { count = 10, topics } = req.query;

        const topicsArray = topics ? (Array.isArray(topics) ? topics : [topics]) : null;

        const result = await adaptiveDifficultyService.getAdaptiveQuestions(
            userId,
            blockId,
            parseInt(count),
            topicsArray
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting adaptive questions:', error);
        res.status(500).json({ error: 'Error al obtener preguntas adaptativas' });
    }
});

// Obtener estadísticas de rendimiento por dificultad
router.get('/performance/:blockId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const blockId = parseInt(req.params.blockId);

        const performance = await adaptiveDifficultyService.getPerformanceByDifficulty(userId, blockId);

        res.json({
            success: true,
            performance
        });
    } catch (error) {
        console.error('Error getting performance:', error);
        res.status(500).json({ error: 'Error al obtener rendimiento' });
    }
});

// Actualizar configuración de dificultad adaptativa
router.put('/settings/:blockId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const blockId = parseInt(req.params.blockId);
        const settings = req.body;

        const success = await adaptiveDifficultyService.updateUserAdaptiveSettings(userId, blockId, settings);

        if (success) {
            res.json({
                success: true,
                message: 'Configuración actualizada'
            });
        } else {
            res.status(500).json({ error: 'Error al actualizar configuración' });
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// Registrar resultado de pregunta (usado internamente por games)
router.post('/record-result', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { questionId, wasCorrect, responseTime } = req.body;

        const success = await adaptiveDifficultyService.recordQuestionResult(
            userId,
            questionId,
            wasCorrect,
            responseTime
        );

        res.json({ success });
    } catch (error) {
        console.error('Error recording result:', error);
        res.status(500).json({ error: 'Error al registrar resultado' });
    }
});

module.exports = router;
