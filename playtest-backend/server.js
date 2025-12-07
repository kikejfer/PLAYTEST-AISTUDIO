const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// PRIMERO, LA CONEXIÓN A LA BASE DE DATOS
const pool = require('./database/connection');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } }));
app.use(compression());

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
const questionLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 200 });
app.use('/api', generalLimiter);
app.use('/api/questions', questionLimiter);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:58500', 'https://playtest-frontend.onrender.com', process.env.FRONTEND_URL].filter(Boolean);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Current-Role'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false, optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const io = new Server(server, { cors: corsOptions, transports: ['websocket', 'polling'], allowEIO3: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const RoutesCompatibilityLayer = require('./routes-compatibility-layer');
const compatibilityLayer = new RoutesCompatibilityLayer();
compatibilityLayer.applyCompatibilityMiddlewares(app);

// --- CARGA DE RUTAS (SEGURAS PORQUE NO SE EJECUTAN HASTA QUE SE LLAMAN) ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
// ... (el resto de las rutas son seguras de cargar)

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... (el resto de app.use)

// --- CARGA DE MÓDULOS "PELIGROSOS" (AHORA SEGUROS GRACIAS A LA INICIALIZACIÓN PEREZOSA) ---
const autoSetup = require('./auto-setup');
const { runMigrations } = require('./auto-migrate');
const LevelsSetup = require('./levels-setup');

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('/api/setup/status', async (req, res) => {
  try {
    const status = await autoSetup.checkStatus();
    res.json({ status: 'OK', autoSetup: status });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);

  // --- PASO CRÍTICO: INICIALIZACIÓN PEREZOSA ---
  // Ahora que el servidor está en marcha, es seguro inicializar los módulos 
  // que dependen de la base de datos. Le pasamos el pool de conexión.
  try {
      console.log('🔧 Initializing lazy-loaded modules...');
      autoSetup.initialize(pool);
      // Si otros módulos necesitaran inicialización, se haría aquí.
      console.log('✅ Lazy modules initialized.');
  } catch(initError) {
      console.error('💥 FATAL: Error initializing lazy modules:', initError);
      // Si esto falla, algo está fundamentalmente mal. El servidor no puede continuar.
      process.exit(1);
  }

  // Ahora que los módulos están inicializados, podemos ejecutar sus funciones de forma segura.
  try {
    await autoSetup.runAutoSetup();
  } catch (setupError) {
    console.error('❌ Error during auto-setup execution:', setupError);
    // No detenemos el servidor, pero advertimos del problema.
  }

  try {
    await runMigrations();
  } catch (migrationError) {
    console.error('❌ Error running migrations:', migrationError);
  }

  console.log('Deploy timestamp:', new Date().toISOString());
});