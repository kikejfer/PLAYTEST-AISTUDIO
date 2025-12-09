const express = require('express');
const router = express.Router();
// Correct Import: Get the function to retrieve the pool.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// Middleware to inject the database pool into the request.
// This is YOUR solution from blocks.js, and it's the correct one.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in challenges.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// ==================== GAME CHALLENGES (Player vs Player) ====================

// Create a game challenge (player challenges another player to a game)
router.post('/', authenticateToken, async (req, res) => {
    // Use the pool from the request object.
    const client = await req.pool.connect();
    try {
        await client.query('BEGIN');

        const { challengedUserId, gameConfig } = req.body;

        if (!challengedUserId || !gameConfig) {
            return res.status(400).json({ error: 'challengedUserId and gameConfig are required' });
        }

        const modeToType = {
            'Modo Clásico': 'classic',
            'Modo Contrarreloj': 'time-trial',
            'Modo Vidas': 'lives',
            'Por Niveles': 'by-levels',
            'Racha de Aciertos': 'streak',
            'Examen Simulado': 'exam',
            'Duelo': 'duel',
            'Maratón': 'marathon',
            'Trivial': 'trivial'
        };

        const gameType = modeToType[gameConfig.mode] || gameConfig.gameType || gameConfig.mode || 'classic';
        const config = gameConfig.config || {};

        const gameResult = await client.query(`
            INSERT INTO games (game_type, config, created_by, status)
            VALUES ($1, $2, $3, 'waiting')
            RETURNING id
        `, [gameType, JSON.stringify(config), req.user.id]);

        const gameId = gameResult.rows[0].id;

        await client.query(`
            INSERT INTO game_players (game_id, user_id, player_index, nickname)
            VALUES ($1, $2, 0, $3)
        `, [gameId, req.user.id, req.user.nickname]);

        const challengedUser = await client.query(
            'SELECT nickname FROM users WHERE id = $1',
            [challengedUserId]
        );

        await client.query(`
            INSERT INTO game_players (game_id, user_id, player_index, nickname)
            VALUES ($1, $2, 1, $3)
        `, [gameId, challengedUserId, challengedUser.rows[0]?.nickname || 'Player']);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            challengeId: gameId,
            message: 'Challenge sent successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating game challenge:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        client.release();
    }
});

// ... (The rest of the file's routes will now use req.pool as well)

module.exports = router;