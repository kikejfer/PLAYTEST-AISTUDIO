const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Security middleware - Configure helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(compression());

// Rate limiting - more generous for question uploads
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for bulk uploads)
});

const questionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200 // Allow more question uploads in shorter window
});

app.use('/api', generalLimiter);
app.use('/api/questions', questionLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS Request from origin:', origin);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:58500',
      'https://playtest-frontend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined/null values

    console.log('🔍 CORS: Checking against allowed origins:', allowedOrigins);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin blocked: ${origin}`);
      console.log(`❌ CORS: Allowed origins are:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Current-Role'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handler for debugging
app.options('*', cors(corsOptions), (req, res) => {
  console.log('✅ OPTIONS preflight handled for:', req.path);
  res.sendStatus(204);
});

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Apply compatibility middlewares before routes
// (This will be configured after compatibility layer is created)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blockRoutes = require('./routes/blocks');
const questionRoutes = require('./routes/questions');
const gameRoutes = require('./routes/games');
const roleRoutes = require('./routes/roles');
const rolesUpdatedRoutes = require('./routes/roles-updated');
const communicationRoutes = require('./routes/communication');
const supportRoutes = require('./routes/support');
const challengesRoutes = require('./routes/challenges');
const challengesAdvancedRoutes = require('./routes/challenges-advanced');
const levelsRoutes = require('./routes/levels');
const featureFlagsRoutes = require('./routes/feature-flags');
const userPreferencesRoutes = require('./routes/user-preferences');
const gameStatesRoutes = require('./routes/game-states');
const creatorsPanelRoutes = require('./routes/creators-panel');
const testMetadataRoutes = require('./routes/test-metadata');
const groupsRoutes = require('./routes/groups');
const studentsRoutes = require('./routes/students');
const teachersRoutes = require('./routes/teachers');
const teachersPanelRoutes = require('./routes/teachers-panel');
const oposicionesRoutes = require('./routes/oposiciones');
const gamificacionRoutes = require('./routes/gamificacion');
const directMessagingRoutes = require('./routes/direct-messaging');
const luminariasRoutes = require('./routes/luminarias');
const dailyQuestsRoutes = require('./routes/daily-quests');
const pushNotificationsRoutes = require('./routes/push-notifications');
const spacedRepetitionRoutes = require('./routes/spaced-repetition');
const adaptiveDifficultyRoutes = require('./routes/adaptive-difficulty');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/roles-updated', rolesUpdatedRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/challenges-advanced', challengesAdvancedRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/game-states', gameStatesRoutes);
app.use('/api/creators-panel', creatorsPanelRoutes);
app.use('/api/test-metadata', testMetadataRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/teachers-panel', teachersPanelRoutes);
app.use('/api/oposiciones', oposicionesRoutes);
app.use('/api/gamificacion', gamificacionRoutes);
app.use('/api/messages', directMessagingRoutes);
app.use('/api/luminarias', luminariasRoutes);
app.use('/api/daily-quests', dailyQuestsRoutes);
app.use('/api/push-notifications', pushNotificationsRoutes);
app.use('/api/spaced-repetition', spacedRepetitionRoutes);
app.use('/api/adaptive-difficulty', adaptiveDifficultyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auto-setup status endpoint
app.get('/api/setup/status', async (req, res) => {
  try {
    const status = await autoSetup.checkStatus();
    res.json({
      status: 'OK',
      autoSetup: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize escalation scheduler
const EscalationScheduler = require('./setup-cron');
const escalationScheduler = new EscalationScheduler();

// Initialize daily quests scheduler
const DailyQuestsScheduler = require('./cron-jobs/daily-quests-scheduler');
const dailyQuestsScheduler = new DailyQuestsScheduler();

// Initialize push notifications scheduler
const PushNotificationScheduler = require('./cron-jobs/push-notification-scheduler');
const pushNotificationScheduler = new PushNotificationScheduler();

// Initialize support automation system (DISABLED - causing SQL errors)
// const supportAutomation = require('./support-automation');

// Auto-setup system
const autoSetup = require('./auto-setup');

// Auto-migration system
const { runMigrations } = require('./auto-migrate');

// Levels system setup
const LevelsSetup = require('./levels-setup');

// Real-time events system
const RealTimeEvents = require('./realtime-events');
const realTimeEvents = new RealTimeEvents(io);

// WebSocket messaging handler
const { MessagingWebSocketHandler, cleanupExpiredTypingStatus } = require('./websocket/messaging-handler');
const messagingHandler = new MessagingWebSocketHandler(io);
messagingHandler.initialize();

// Cleanup expired typing status every minute
const cron = require('node-cron');
cron.schedule('* * * * *', cleanupExpiredTypingStatus);

// Make io available to routes
app.set('io', io);
app.set('messagingHandler', messagingHandler);

// Routes compatibility layer for unified tables
const RoutesCompatibilityLayer = require('./routes-compatibility-layer');
const compatibilityLayer = new RoutesCompatibilityLayer();

// Make schedulers globally accessible for API routes
global.escalationScheduler = escalationScheduler;
global.dailyQuestsScheduler = dailyQuestsScheduler;
// global.supportAutomation = supportAutomation;
global.realTimeEvents = realTimeEvents;
global.compatibilityLayer = compatibilityLayer;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 WebSocket server enabled`);
  
  // Apply compatibility middlewares after all systems are initialized
  compatibilityLayer.applyCompatibilityMiddlewares(app);
  
  // Check migration status
  const migrationStatus = await compatibilityLayer.checkMigrationStatus();
  if (migrationStatus.migration_complete) {
    console.log('✅ Sistema de tablas unificadas verificado');
  } else {
    console.log('⚠️  Sistema requiere migración de tablas unificadas');
    console.log('💡 Ejecuta: node critical-fixes-migration.js');
  }
  
  // Run auto-setup (only executes if needed)
  await autoSetup.runAutoSetup();

  // Run auto-migrations (ensures database schema is up to date)
  try {
    await runMigrations();
  } catch (migrationError) {
    console.error('❌ Error running migrations:', migrationError);
    console.log('⚠️  Server will continue, but some features may not work');
  }

  // Initialize levels system
  const levelsSetup = new LevelsSetup();
  try {
    const levelsHealth = await levelsSetup.checkSystemHealth();
    if (levelsHealth.status === 'healthy') {
      console.log('🏆 Sistema de niveles verificado y funcionando');
      
      // Start periodic calculations
      setInterval(async () => {
        try {
          await levelsSetup.processAsyncCalculations();
        } catch (error) {
          console.error('Error en cálculos automáticos de niveles:', error);
        }
      }, 5 * 60 * 1000); // Cada 5 minutos
      
    } else {
      console.log('⚠️  Sistema de niveles requiere configuración inicial');
      console.log('💡 Ejecuta: node complete-levels-migration.js');
    }
  } catch (levelsError) {
    console.error('❌ Error verificando sistema de niveles:', levelsError);
  }
  
  // Start escalation scheduler
  escalationScheduler.start();

  // Start daily quests scheduler
  dailyQuestsScheduler.start();

  // Start push notifications scheduler
  pushNotificationScheduler.start();
  
  // Start support automation system (DISABLED - causing SQL errors)
  // supportAutomation.start().then(() => {
  //   console.log('🤖 Sistema de automatización de soporte iniciado');
  // }).catch(err => {
  //   console.error('❌ Error iniciando sistema de automatización:', err);
  // });
});

console.log('Deploy timestamp:', new Date().toISOString());
console.log('🔄 Expandable blocks and themes functionality confirmed active');
