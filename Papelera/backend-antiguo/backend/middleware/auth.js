const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * Verifica el token y agrega la información del usuario a req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      console.error('Error verificando token:', err);
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar roles específicos
 * @param {string|string[]} requiredRoles - Rol o array de roles requeridos
 * @returns {Function} Middleware function
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRoles = req.user.roles || [];
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = rolesArray.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes para acceder a este recurso',
        required_roles: rolesArray,
        user_roles: userRoles
      });
    }

    next();
  };
};

/**
 * Middleware para verificar permisos específicos
 * @param {string|string[]} requiredPermissions - Permiso o array de permisos requeridos
 * @returns {Function} Middleware function
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userPermissions = req.user.permissions || [];
    const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    // Verificar si el usuario tiene todos los permisos requeridos
    const hasAllPermissions = permissionsArray.every(permission => userPermissions.includes(permission));
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes para realizar esta acción',
        required_permissions: permissionsArray,
        user_permissions: userPermissions
      });
    }

    next();
  };
};

/**
 * Middleware para verificar feature flags
 * @param {string|string[]} requiredFeatures - Feature o array de features requeridos
 * @returns {Function} Middleware function
 */
const requireFeature = (requiredFeatures) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userFeatures = req.user.features || {};
    const featuresArray = Array.isArray(requiredFeatures) ? requiredFeatures : [requiredFeatures];
    
    // Verificar si todas las features requeridas están habilitadas
    const hasAllFeatures = featuresArray.every(feature => userFeatures[feature] === true);
    
    if (!hasAllFeatures) {
      return res.status(403).json({
        success: false,
        message: 'Funcionalidad no disponible',
        required_features: featuresArray,
        available_features: Object.keys(userFeatures).filter(f => userFeatures[f])
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No bloquea la request si no hay token, pero agrega user info si está disponible
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * Middleware para verificar que el usuario es propietario del recurso
 * @param {string} userIdParam - Nombre del parámetro que contiene el user ID
 * @returns {Function} Middleware function
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Administradores principales pueden acceder a cualquier recurso
    if (req.user.roles?.includes('administrador_principal')) {
      return next();
    }
    
    // Verificar que el usuario sea propietario del recurso
    if (req.user.id !== resourceUserId && req.user.id !== parseInt(resourceUserId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * Middleware para rate limiting por usuario
 * @param {number} maxRequests - Máximo número de requests
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {Function} Middleware function
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Sin rate limit para usuarios no autenticados
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Obtener requests del usuario
    let requests = userRequests.get(userId) || [];
    
    // Filtrar requests dentro de la ventana de tiempo
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }

    // Agregar request actual
    requests.push(now);
    userRequests.set(userId, requests);

    next();
  };
};

/**
 * Middleware para logging de actividad
 */
const logActivity = (req, res, next) => {
  if (req.user) {
    console.log(`[${new Date().toISOString()}] User ${req.user.id} (${req.user.email}) accessed ${req.method} ${req.originalUrl}`);
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireFeature,
  optionalAuth,
  requireOwnership,
  rateLimitByUser,
  logActivity
};