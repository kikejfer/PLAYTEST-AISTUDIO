      const express = require('express');
      const router = express.Router();
      const { getPool } = require('../database/connection');
      const { authenticateToken } = require('../middleware/auth');
      
      const getDBPool = (req, res, next) => {
          try {
              req.pool = getPool();
              next();
          } catch (error) {
              console.error("Failed to get DB Pool in direct-messaging.js", error);
              res.status(500).json({ error: 'Database connection failed' });
          }
      };
      
      router.use(getDBPool);

      // Endpoint para obtener el conteo de mensajes no leídos
      router.get('/unread-count', authenticateToken, async (req, res) => {
          const userId = req.user.id;
          if (!userId) {
              return res.status(400).json({ error: 'User ID is missing' });
          }

          try {
              const pool = req.pool;
              const query = 'SELECT COUNT(*) as unreadCount FROM direct_messages WHERE recipient_id = $1 AND is_read = false';
              const result = await pool.query(query, [userId]);
              const unreadCount = result.rows[0].unreadcount; // .rows[0].unreadcount (PostgreSQL often returns lowercase)
              
              console.log(`Unread count for user ${userId} is ${unreadCount}`);
              res.json({ unreadCount: Number(unreadCount) }); // Ensure it's a number
          } catch (error) {
              console.error('Error fetching unread messages count:', error);
              res.status(500).json({ error: 'Could not fetch unread messages count' });
          }
      });
      
      module.exports = router;
