const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
// Correct Import: Get the function to retrieve the pool.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in communication.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply the middleware to all routes in this file.
router.use(getDBPool);

// ... (Multer configuration remains the same)

// Get categories filtered by origin type
router.get('/categories/:originType', authenticateToken, async (req, res) => {
  try {
    const { originType } = req.params;
    const result = await req.pool.query(
      `SELECT id, name FROM ticket_categories WHERE origin_type = $1 ORDER BY name`,
      [originType]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new ticket
router.post('/tickets', authenticateToken, /* upload.array('attachments'), */ async (req, res) => {
  const client = await req.pool.connect();
  try {
    await client.query('BEGIN');
    const { categoryId, title, description } = req.body;
    const ticketResult = await client.query(
      `INSERT INTO tickets (category_id, created_by, title, description) VALUES ($1, $2, $3, $4) RETURNING id`,
      [categoryId, req.user.id, title, description]
    );
    const ticket = ticketResult.rows[0];
    await client.query('COMMIT');
    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


// ... (The rest of the file's routes need to be updated to use req.pool)
// This is a simplified example of the correction.

module.exports = router;