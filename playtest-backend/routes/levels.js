const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
// CORRECT: Get the getPool function to be able to inject it
const { getPool } = require('../database/connection');

// These will need to be adapted if they also connect to the DB
const LevelsCalculator = require('../levels-calculator');
const LevelsNotificationSystem = require('../levels-notifications');

// Middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in levels.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply middleware for pool injection and authentication to all routes
router.use(getDBPool, authenticateToken);

// Middleware for admin-only routes
const requireAdminRole = (req, res, next) => {
    // Simplified check, in a real scenario this would be more robust
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};

// ==================== LEVEL QUERIES ====================

// Get level definitions
router.get('/definitions', async (req, res) => {
    try {
        const result = await req.pool.query('SELECT * FROM level_definitions ORDER BY level_type, level_order');
        res.json({ level_definitions: result.rows });
    } catch (error) {
        console.error('Error getting level definitions:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Recalculate levels for the current user
router.post('/recalculate', async (req, res) => {
    try {
        // Assuming LevelsCalculator is refactored to accept a pool object
        const calculator = new LevelsCalculator(req.pool);
        const results = await calculator.updateAllUserLevels(req.user.id);
        
        // Assuming LevelsNotificationSystem is refactored
        const notificationSystem = new LevelsNotificationSystem(req.pool);
        for (const notification of results.notifications_needed) {
            await notificationSystem.sendLevelUpNotification(req.user.id, notification);
        }

        res.json({ message: 'Niveles recalculados', results });
    } catch (error) {
        console.error('Error recalculating levels:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== ADMIN FUNCTIONS ====================

// Get level rankings for a specific level type (Admin)
router.get('/rankings/:levelType', requireAdminRole, async (req, res) => {
    try {
        const { levelType } = req.params;
        const { limit = 50 } = req.query;
        const query = `
            SELECT u.nickname, ld.level_name, ul.achieved_at
            FROM users u
            JOIN user_levels ul ON u.id = ul.user_id
            JOIN level_definitions ld ON ul.current_level_id = ld.id
            WHERE ul.level_type = $1
            ORDER BY ld.level_order DESC, ul.achieved_at ASC
            LIMIT $2`;

        const result = await req.pool.query(query, [levelType, parseInt(limit)]);
        res.json({ ranking: result.rows });
    } catch (error) {
        console.error('Error getting rankings:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
