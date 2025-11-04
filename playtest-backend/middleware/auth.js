const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  console.log('🔐 authenticateToken called for:', req.method, req.path);

  const authHeader = req.headers['authorization'];
  console.log('🔑 Authorization header present:', !!authHeader);

  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  console.log('🔑 Token present, length:', token.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully for userId:', decoded.userId);

    // Verify user still exists and session is valid
    const result = await pool.query(
      'SELECT u.id, u.nickname FROM users u WHERE u.id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database for userId:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ User found:', result.rows[0].nickname);

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
    console.error('❌ Auth error:', error.name, error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };