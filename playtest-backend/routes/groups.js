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
        console.error("Failed to get DB Pool in groups.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// Create a new group (TEACHER only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Group name required' });

        // Verify teacher role
        const roleCheck = await req.pool.query("SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'profesor'", [req.user.id]);
        if (roleCheck.rowCount === 0) {
            return res.status(403).json({ error: 'Only teachers can create groups' });
        }

        const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const result = await req.pool.query(
            'INSERT INTO groups (name, description, created_by, access_code) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, req.user.id, access_code]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific group by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query('SELECT * FROM groups WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get members of a specific group
router.get('/:id/members', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query(
            `SELECT u.id, u.nickname FROM users u
             JOIN group_members gm ON u.id = gm.user_id
             WHERE gm.group_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Student joins a group
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { access_code } = req.body;
        const groupResult = await req.pool.query('SELECT id FROM groups WHERE access_code = $1', [access_code]);
        if (groupResult.rowCount === 0) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        const groupId = groupResult.rows[0].id;
        await req.pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [groupId, req.user.id]
        );
        res.json({ message: 'Successfully joined group' });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
