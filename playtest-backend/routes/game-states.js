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
        console.error("Failed to get DB Pool in game-states.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// Save or update a game state
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { game_id, session_id, game_type, current_state, progress } = req.body;
        
        if (!game_type || !current_state) {
            return res.status(400).json({ error: 'game_type and current_state are required' });
        }

        const result = await req.pool.query(
            `INSERT INTO persistent_game_states (user_id, game_id, session_id, game_type, current_state, progress)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, game_id, session_id) DO UPDATE SET
                current_state = EXCLUDED.current_state,
                progress = EXCLUDED.progress,
                last_checkpoint = CURRENT_TIMESTAMP
             RETURNING id, last_checkpoint`,
            [req.user.id, game_id, session_id || `sess_${Date.now()}`, game_type, current_state, progress || {}]
        );

        res.json({
            success: true,
            state_id: result.rows[0].id,
            last_checkpoint: result.rows[0].last_checkpoint
        });
    } catch (error) {
        console.error('Error saving game state:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific game state by ID
router.get('/:stateId', authenticateToken, async (req, res) => {
    try {
        const { stateId } = req.params;
        const result = await req.pool.query(
            'SELECT * FROM persistent_game_states WHERE id = $1 AND user_id = $2',
            [stateId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Game state not found' });
        }

        res.json({ state: result.rows[0] });
    } catch (error) {
        console.error('Error fetching game state:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Load the last game state for a specific game
router.get('/game/:gameId', authenticateToken, async (req, res) => {
    try {
        const { gameId } = req.params;
        const result = await req.pool.query(
            `SELECT * FROM persistent_game_states
             WHERE game_id = $1 AND user_id = $2
             ORDER BY last_checkpoint DESC
             LIMIT 1`,
            [gameId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No saved state found for this game' });
        }

        res.json({ state: result.rows[0] });
    } catch (error) {
        console.error('Error loading game state:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a game state
router.delete('/:stateId', authenticateToken, async (req, res) => {
    try {
        const { stateId } = req.params;
        const result = await req.pool.query(
            'DELETE FROM persistent_game_states WHERE id = $1 AND user_id = $2 RETURNING id',
            [stateId, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Game state not found' });
        }

        res.json({ success: true, deleted_id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting game state:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
