const express = require('express');
// PASO 1: Importar el MÉTODO para obtener el pool, no el pool directamente.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  // PASO 2: Obtener el pool de conexión seguro DENTRO de la ruta.
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT u.id, u.nickname, u.email, u.first_name, u.last_name, u.created_at,
        up.answer_history, up.stats, up.preferences, up.loaded_blocks,
        COALESCE(ul.current_balance, 0) as luminarias
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_luminarias ul ON u.id = ul.user_id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const userRoles = req.user.roles || [];
    
    const response = {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      roles: userRoles,
      answerHistory: user.answer_history || [],
      stats: user.stats || {},
      preferences: user.preferences || {},
      loadedBlocks: user.loaded_blocks || [],
      luminarias: parseInt(user.luminarias, 10) || 0
    };
    
    res.json(response);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const pool = getPool();
  try {
    const { email, firstName, lastName, preferences } = req.body;

    if (email) {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, req.user.id]);
    }
    if (firstName) {
       await pool.query('UPDATE users SET first_name = $1 WHERE id = $2', [firstName, req.user.id]);
    }
    if (lastName) {
        await pool.query('UPDATE users SET last_name = $1 WHERE id = $2', [lastName, req.user.id]);
    }
    if (preferences) {
      await pool.query(
        'INSERT INTO user_profiles (user_id, preferences) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET preferences = $2',
        [req.user.id, preferences]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Todas las demás rutas refactorizadas para usar getPool() ---

router.get('/', authenticateToken, async (req, res) => {
    const pool = getPool();
    try {
        const result = await pool.query('SELECT id, nickname FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
