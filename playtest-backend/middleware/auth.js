const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and session is valid
    const result = await pool.query(
      'SELECT u.id, u.nickname FROM users u WHERE u.id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: decoded.userId,
      nickname: result.rows[0].nickname,
      roles: decoded.roles || []
    };

    next();
  } catch (error) {
    // Handle token expiration specifically
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token expired for:', req.path);
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.'
      });
    }

    // Handle other JWT errors
    console.error('❌ Auth error:', error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };