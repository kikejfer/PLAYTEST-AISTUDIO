const express = require('express');
const router = express.Router();
// Correct Import: Get the function to retrieve the pool.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// Middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in daily-quests.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// Get active quests for the user for today
router.get('/my-quests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Corrected to use req.user.userId
        const result = await req.pool.query(`
            SELECT uq.id, t.quest_name, uq.status, uq.current_progress, uq.target_value
            FROM user_daily_quests uq
            JOIN daily_quest_templates t ON t.id = uq.template_id
            WHERE uq.user_id = $1 AND uq.quest_date = CURRENT_DATE
        `, [userId]);
        res.json({ success: true, quests: result.rows });
    } catch (error) {
        console.error('Error fetching daily quests:', error);
        res.status(500).json({ error: 'Error al obtener misiones diarias' });
    }
});

// Claim reward for a completed quest
router.post('/claim-reward/:questId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const questId = parseInt(req.params.questId);

        // The database function will handle all logic and transactions safely.
        const result = await req.pool.query(
            'SELECT * FROM claim_daily_quest_reward($1, $2)',
            [questId, userId]
        );

        const claimResult = result.rows[0];
        if (claimResult.success) {
            res.json({ success: true, message: claimResult.message });
        } else {
            res.status(400).json({ success: false, error: claimResult.message });
        }
    } catch (error) {
        console.error('Error claiming quest reward:', error);
        res.status(500).json({ error: 'Error al reclamar recompensa' });
    }
});

// Admin endpoint to generate quests
router.post('/generate-for-user/:userId', authenticateToken, async (req, res) => {
    try {
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const targetUserId = parseInt(req.params.userId);
        
        // Pass the pool to the helper function
        const generated = await generateDailyQuestsForUser(req.pool, targetUserId);
        res.json({ success: true, generated: generated.length });
    } catch (error) {
        console.error('Error generating quests:', error);
        res.status(500).json({ error: 'Error al generar misiones' });
    }
});


// =====================================================
// AUXILIARY FUNCTIONS (now accepting pool as a parameter)
// =====================================================

async function generateDailyQuestsForUser(pool, userId, date = null) {
    const questDate = date || new Date().toISOString().split('T')[0];
    const existing = await pool.query(
        `SELECT id FROM user_daily_quests WHERE user_id = $1 AND quest_date = $2`,
        [userId, questDate]
    );
    if (existing.rows.length > 0) return [];

    const difficulties = ['easy', 'medium', 'hard'];
    const selectedQuests = [];
    for (const difficulty of difficulties) {
        const result = await pool.query(
            `SELECT id, target_value FROM daily_quest_templates WHERE difficulty = $1 AND is_active = TRUE ORDER BY RANDOM() LIMIT 1`,
            [difficulty]
        );
        if (result.rows.length > 0) {
            const template = result.rows[0];
            const insertResult = await pool.query(
                `INSERT INTO user_daily_quests (user_id, template_id, quest_date, target_value) VALUES ($1, $2, $3, $4) RETURNING id`,
                [userId, template.id, questDate, template.target_value]
            );
            selectedQuests.push(insertResult.rows[0].id);
        }
    }
    return selectedQuests;
}

module.exports = router;