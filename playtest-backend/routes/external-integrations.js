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
        console.error("Failed to get DB Pool in external-integrations.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);


// Middleware to verify admin role, now using req.pool
const requireAdminRole = async (req, res, next) => {
    try {
        const adminCheck = await req.pool.query(
            `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1`,
            [req.user.id]
        );
        const isAdmin = adminCheck.rows.some(row => row.name === 'administrador_principal' || row.name === 'administrador_secundario');
        if (!isAdmin) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
};

// Get integration configurations
router.get('/configurations', authenticateToken, requireAdminRole, async (req, res) => {
    try {
        const configs = await req.pool.query('SELECT id, integration_name, provider_name, is_active FROM integration_configurations');
        res.json({ integrations: configs.rows });
    } catch (error) {
        console.error('Error getting configurations:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Create new integration configuration
router.post('/configurations', authenticateToken, requireAdminRole, async (req, res) => {
    try {
        const { integration_name, provider_name } = req.body;
        const result = await req.pool.query(
            'INSERT INTO integration_configurations (integration_name, provider_name) VALUES ($1, $2) RETURNING id',
            [integration_name, provider_name]
        );
        res.status(201).json({ message: 'Configuration created', integration: result.rows[0] });
    } catch (error) {
        console.error('Error creating configuration:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Sync students from an external system
router.post('/sync/students', authenticateToken, requireAdminRole, async (req, res) => {
    try {
        const { integration_id } = req.body;
        const config = await req.pool.query('SELECT * FROM integration_configurations WHERE id = $1', [integration_id]);
        if (config.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        
        // Pass the pool to the simulation function
        const syncResult = await simulateStudentSync(req.pool, config.rows[0]);

        res.json({ message: 'Student sync completed', result: syncResult });
    } catch (error) {
        console.error('Error syncing students:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ==========================================
// SIMULATION FUNCTIONS (now accepting pool)
// ==========================================

async function simulateStudentSync(pool, config) {
    const externalStudents = [{ external_id: 'SIM001', username: 'sim_student', email: 'sim@test.com' }];
    let created = 0;

    for (const extStudent of externalStudents) {
        const existingUser = await pool.query('SELECT id FROM users WHERE external_id = $1', [extStudent.external_id]);
        if (existingUser.rows.length === 0) {
            await pool.query('INSERT INTO users (nickname, email, external_id) VALUES ($1, $2, $3)', [extStudent.username, extStudent.email, extStudent.external_id]);
            created++;
        }
    }
    return { status: 'completed', created, processed: externalStudents.length };
}

module.exports = router;
