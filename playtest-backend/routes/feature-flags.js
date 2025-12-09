const express = require('express');
// CORRECT: No direct pool import. We get it from the request.
const { authenticateToken } = require('../middleware/auth');
const { getPool } = require('../database/connection');

const router = express.Router();

// Middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in feature-flags.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// Middleware to check for admin privileges using the correct pool
const requireAdmin = async (req, res, next) => {
    try {
        const userRoles = await req.pool.query(
            `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1`,
            [req.user.id]
        );
        const isAdmin = userRoles.rows.some(role => 
            ['administrador_principal', 'administrador_secundario'].includes(role.name)
        );
        if (!isAdmin) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    } catch (error) {
        console.error('Admin check failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all feature flags
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await req.pool.query('SELECT flag_name, is_enabled, description FROM feature_flags');
        const flags = {};
        result.rows.forEach(row => {
            flags[row.flag_name] = {
                enabled: row.is_enabled,
                description: row.description
            };
        });
        res.json(flags);
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific feature flag by name
router.get('/:flagName', authenticateToken, async (req, res) => {
    try {
        const { flagName } = req.params;
        const result = await req.pool.query('SELECT * FROM feature_flags WHERE flag_name = $1', [flagName]);
        if (result.rows.length === 0) {
            return res.status(404).json({ enabled: false, error: 'Flag not found' });
        }
        res.json({ enabled: result.rows[0].is_enabled, config: result.rows[0].config });
    } catch (error) {
        console.error('Error fetching feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or update a feature flag (admin only)
router.put('/:flagName', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { flagName } = req.params;
        const { enabled, description, config } = req.body;

        const result = await req.pool.query(
            `INSERT INTO feature_flags (flag_name, is_enabled, description, config)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (flag_name)
             DO UPDATE SET is_enabled = $2, description = $3, config = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [flagName, enabled, description, config || {}]
        );

        res.json({
            success: true,
            flag: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a feature flag (admin only)
router.delete('/:flagName', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { flagName } = req.params;
        const result = await req.pool.query('DELETE FROM feature_flags WHERE flag_name = $1 RETURNING flag_name', [flagName]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Feature flag not found' });
        }
        res.json({ success: true, deleted: result.rows[0].flag_name });
    } catch (error) {
        console.error('Error deleting feature flag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
