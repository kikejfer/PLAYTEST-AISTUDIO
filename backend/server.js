const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============ MIDDLEWARE DE SEGURIDAD ============

// Helmet para seguridad básica
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configurado
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://playtest-frontend.onrender.com', 'https://playtest.com', 'https://www.playtest.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Current-Role']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// ============ MIDDLEWARE GENERAL ============

// Compresión
app.use(compression());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ============ IMPORTAR RUTAS ============

const adminPrincipalRoutes = require('./routes/adminPrincipal');
const studentsRoutes = require('./routes/students');
const blocksRoutes = require('./routes/blocks');
const teachersRoutes = require('./routes/teachers');
// const servicioTecnicoRoutes = require('./routes/servicio-tecnico');
// const financieroRoutes = require('./routes/financiero');
// const searchRoutes = require('./routes/search');

// Importar rutas adicionales (crear estos archivos según necesidades)
// const adminSecundarioRoutes = require('./routes/adminSecundario');
// const juegoRoutes = require('./routes/juego');
// const authRoutes = require('./routes/auth');
// const notificationsRoutes = require('./routes/notifications');

// ============ CONFIGURAR RUTAS ============

// Rutas principales del sistema
app.use('/api/admin', adminPrincipalRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/teachers-panel', teachersRoutes); // Alias para compatibilidad con frontend
// app.use('/api/servicio-tecnico', servicioTecnicoRoutes);
// app.use('/api/financiero', financieroRoutes);
// app.use('/api/search', searchRoutes);

// Rutas adicionales (descomentar cuando se implementen)
// app.use('/api/admin-secundario', adminSecundarioRoutes);
// app.use('/api/juego', juegoRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/notifications', notificationsRoutes);

// ============ RUTAS DE SISTEMA ============

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

/**
 * Feature flags endpoint
 */
app.get('/api/features', (req, res) => {
  const defaultFeatures = {
    // Sistema de Competición
    competition_duels: true,
    competition_trivial: true,
    competition_tournaments: true,
    competition_rankings: true,
    
    // Sistema de Monetización
    monetization_plans: true,
    monetization_marketplace: true,
    monetization_luminarias: true,
    
    // Sistema de IA
    ai_question_generation: false,
    ai_suggestions: true,
    ai_analytics: true,
    
    // Herramientas Avanzadas
    tools_advanced_analytics: true,
    tools_bulk_operations: true,
    tools_custom_themes: false,
    
    // Notificaciones
    notifications_real_time: true,
    notifications_email: true,
    notifications_push: false,
    
    // Integraciones
    integrations_lms: false,
    integrations_social: true,
    integrations_calendar: true,
    
    // Seguridad
    security_2fa: true,
    security_audit_logs: true,
    security_advanced_permissions: true,
    
    // Soporte
    support_live_chat: false,
    support_ticket_system: true,
    support_knowledge_base: true,
    
    // Experimental
    experimental_voice_questions: false,
    experimental_ar_mode: false,
    experimental_ai_tutor: false
  };

  res.json({
    success: true,
    features: defaultFeatures
  });
});

/**
 * User roles and permissions endpoint
 */
app.get('/api/user/roles', (req, res) => {
  // Esta ruta debería estar protegida con authenticateToken
  // Por ahora devolvemos datos mock
  res.json({
    success: true,
    user: {
      id: 1,
      email: 'admin@playtest.com',
      roles: ['administrador_principal'],
      permissions: [
        'admin.read',
        'admin.write',
        'admin.delete',
        'users.manage',
        'content.manage',
        'system.configure'
      ],
      features: {
        competition_duels: true,
        monetization_plans: true,
        ai_suggestions: true
      }
    }
  });
});

// ============ MANEJO DE ERRORES ============

/**
 * Error handler para rutas no encontradas
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

/**
 * Error handler global
 */
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  // No revelar detalles del error en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(isDevelopment && {
      stack: err.stack,
      details: err
    })
  });
});

// ============ WEBSOCKET PARA NOTIFICACIONES ============

const http = require('http');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Manejar conexiones WebSocket para notificaciones en tiempo real
wss.on('connection', (ws, req) => {
  console.log('Nueva conexión WebSocket establecida');
  
  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Conectado al sistema de notificaciones PLAYTEST',
    timestamp: new Date().toISOString()
  }));
  
  // Manejar mensajes del cliente
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensaje recibido:', data);
      
      // Aquí se puede implementar lógica para manejar diferentes tipos de mensajes
      if (data.type === 'authenticate') {
        // Autenticar conexión WebSocket con token
        // TODO: Implementar autenticación WebSocket
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
    }
  });
  
  // Manejar desconexión
  ws.on('close', () => {
    console.log('Conexión WebSocket cerrada');
  });
  
  // Manejar errores
  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
});

// Función para enviar notificaciones a todos los clientes conectados
const broadcastNotification = (notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
      }));
    }
  });
};

// Hacer la función de broadcast disponible globalmente
global.broadcastNotification = broadcastNotification;

// ============ INICIAR SERVIDOR ============

server.listen(PORT, () => {
  console.log(`
🚀 Servidor PLAYTEST iniciado exitosamente
📍 Puerto: ${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
🕒 Timestamp: ${new Date().toISOString()}
📡 WebSocket habilitado para notificaciones en tiempo real
🛡️  Seguridad: Helmet, CORS, Rate Limiting activados
  `);
  
  // Enviar notificación de inicio del sistema
  setTimeout(() => {
    broadcastNotification({
      context: 'system',
      priority: 'info',
      message: 'Sistema PLAYTEST iniciado correctamente'
    });
  }, 1000);
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;