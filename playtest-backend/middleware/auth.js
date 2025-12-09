const jwt = require('jsonwebtoken');
// FIX: Importar el método para obtener el pool, no el pool directamente.
const { getPool } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  console.log('🔐 authenticateToken called for:', req.method, req.path);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // FIX: Obtener el pool inicializado dentro de la función.
    const pool = getPool();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: Usar `decoded.id` que es el estándar en esta aplicación, en lugar de `decoded.userId`.
    const userId = decoded.id;

    if (!userId) {
      console.log('❌ No ID found in JWT payload', decoded);
      return res.status(403).json({ error: 'Invalid token payload' });
    }
    
    console.log('✅ Token verified successfully for userId:', userId);

    // Verificar que el usuario todavía existe y obtener sus roles.
    const result = await pool.query(
      `SELECT u.id, u.nickname,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'code', CASE r.name
              WHEN 'administrador_principal' THEN 'ADP'
              WHEN 'administrador_secundario' THEN 'ADS'
              WHEN 'profesor' THEN 'PRF'
              WHEN 'creador' THEN 'CRD'
              WHEN 'jugador' THEN 'PJG'
              WHEN 'soporte_tecnico' THEN 'SPT'
              ELSE r.name
            END,
            'name', r.name,
            'panel', CASE r.name
              WHEN 'administrador_principal' THEN 'PAP'
              WHEN 'administrador_secundario' THEN 'PAS'
              WHEN 'profesor' THEN 'PPF'
              WHEN 'creador' THEN 'PCC'
              WHEN 'jugador' THEN 'PJG'
              WHEN 'soporte_tecnico' THEN 'PST'
              ELSE 'PJG'
            END
          ))
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = u.id
          ), '[]'::json
        ) as roles
      FROM users u WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found in database for userId:', userId);
      return res.status(401).json({ error: 'Invalid token: User does not exist' });
    }

    console.log('✅ User found:', result.rows[0].nickname, 'with roles:', result.rows[0].roles);

    req.user = {
      id: userId,
      nickname: result.rows[0].nickname,
      roles: result.rows[0].roles || []
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token expired for:', req.path);
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.'
      });
    }

    console.error('❌ Auth error:', error.name, error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
