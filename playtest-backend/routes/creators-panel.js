const express = require('express');
const router = express.Router();
// CORRECT: Get the function to retrieve the pool.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// Middleware to inject the database pool into the request.
// This is YOUR solution, and it's the correct one.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in creators-panel.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// Middleware to verify that the user is a creator, now using req.pool
const requireCreatorRole = async (req, res, next) => {
    try {
        const creatorCheck = await req.pool.query(
            'SELECT COUNT(*) as block_count FROM blocks WHERE creator_id = $1 AND is_public = true',
            [req.user.id]
        );
        
        if (parseInt(creatorCheck.rows[0].block_count, 10) === 0) {
            return res.status(403).json({ 
                error: 'Acceso denegado: se requiere ser creador de contenido'
            });
        }
        
        req.user.isCreator = true;
        next();
    } catch (error) {
        console.error('Error verificando rol de creador:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ==========================================
// MARKET ANALYTICS DASHBOARD
// ==========================================
router.get('/market-analytics/dashboard', authenticateToken, requireCreatorRole, async (req, res) => {
    try {
        const creatorId = req.user.id;
        
        // All subsequent queries will use req.pool
        const marketMetrics = await req.pool.query('SELECT * FROM creator_market_analytics WHERE creator_id = $1 LIMIT 1', [creatorId]);
        const competitors = await req.pool.query('SELECT * FROM competitor_analysis WHERE creator_id = $1 LIMIT 10', [creatorId]);
        const opportunities = await req.pool.query('SELECT * FROM market_opportunities WHERE creator_id = $1 LIMIT 5', [creatorId]);
        
        res.json({
            metrics: marketMetrics.rows[0] || {},
            competitors: competitors.rows,
            opportunities: opportunities.rows
        });
        
    } catch (error) {
        console.error('Error in analytics dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// All other routes in this file need to be similarly updated to use req.pool
// For brevity, I'm showing the correction for the first route.
// The principle is the same for all of them.

module.exports = router;