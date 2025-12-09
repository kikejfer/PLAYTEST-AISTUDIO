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
        console.error("Failed to get DB Pool in games.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// FIX: Add the missing /configurations route.
router.get('/configurations', authenticateToken, async (req, res) => {
    try {
        const result = await req.pool.query('SELECT * FROM game_configurations');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching game configurations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new game
router.post('/', authenticateToken, async (req, res) => {
    const client = await req.pool.connect();
    try {
        await client.query('BEGIN');
        const { gameType, config, players } = req.body;

        if (!gameType || !players || players.length === 0) {
            return res.status(400).json({ error: 'Game type and players are required' });
        }

        const gameResult = await client.query(
            'INSERT INTO games (game_type, config, created_by, status) VALUES ($1, $2, $3, $4) RETURNING id',
            [gameType, config, req.user.id, 'active']
        );
        const gameId = gameResult.rows[0].id;

        for (const player of players) {
            await client.query(
                'INSERT INTO game_players (game_id, user_id, nickname) VALUES ($1, $2, $3)',
                [gameId, player.userId, player.nickname]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ gameId: gameId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Get a specific game by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.pool.query(
            `SELECT g.id, g.game_type, g.status, g.config, g.game_state, json_agg(gp.nickname) as players
             FROM games g
             JOIN game_players gp ON g.id = gp.game_id
             WHERE g.id = $1
             GROUP BY g.id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update game state or status
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, gameState } = req.body;

        // Basic validation
        const playerCheck = await req.pool.query(
            'SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        if (playerCheck.rowCount === 0) {
            return res.status(403).json({ error: 'Not a player in this game' });
        }

        const result = await req.pool.query(
            `UPDATE games SET status = COALESCE($1, status), game_state = COALESCE($2, game_state), updated_at = NOW()
             WHERE id = $3 RETURNING *`,
            [status, gameState, id]
        );

        res.json({ message: 'Game updated', game: result.rows[0] });
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save a score for a completed game
router.post('/:id/scores', authenticateToken, async (req, res) => {
    const client = await req.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { scoreData, gameType } = req.body;

        // Verify player
        const playerCheck = await client.query('SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2', [id, req.user.id]);
        if (playerCheck.rowCount === 0) {
            return res.status(403).json({ error: 'Not authorized to save score for this game' });
        }

        // Save score
        await client.query(
            'INSERT INTO game_scores (game_id, user_id, game_type, score, score_data) VALUES ($1, $2, $3, $4, $5)',
            [id, req.user.id, gameType, scoreData.score || 0, scoreData]
        );

        // Mark game as completed
        await client.query('UPDATE games SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', id]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Score saved successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving game score:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
