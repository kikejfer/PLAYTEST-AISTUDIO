const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// PASO 1: Importar el NUEVO gestor de la base de datos.
const db = require('./database/connection');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
app.use(cors()); // CORS simplificado por ahora, se puede ajustar si es necesario
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Socket.IO ---
const io = new Server(server, { cors: { origin: "*" } });
app.set('io', io);

// --- Carga de Rutas (Ahora son solo definiciones, seguras de cargar) ---
// FIX: Cargar TODAS las rutas del directorio /routes.
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blockRoutes = require('./routes/blocks');
const questionRoutes = require('./routes/questions');
const gameRoutes = require('./routes/games');
const roleRoutes = require('./routes/roles');
const communicationRoutes = require('./routes/communication');
const supportRoutes = require('./routes/support');
const challengesRoutes = require('./routes/challenges');
const levelsRoutes = require('./routes/levels');
const dailyQuestsRoutes = require('./routes/daily-quests');
const studentsRoutes = require('./routes/students');
const groupsRoutes = require('./routes/groups');
const creatorsPanelRoutes = require('./routes/creators-panel');
const oposicionesRoutes = require('./routes/oposiciones');
const teachersRoutes = require('./routes/teachers');
const teachersPanelRoutes = require('./routes/teachers-panel');
const directMessagingRoutes = require('./routes/direct-messaging');
const gamificacionRoutes = require('./routes/gamificacion');
const luminariasRoutes = require('./routes/luminarias');
const adaptiveDifficultyRoutes = require('./routes/adaptive-difficulty');
const aiAnalyticsRoutes = require('./routes/ai-analytics');
const challengesAdvancedRoutes = require('./routes/challenges-advanced');
const externalIntegrationsRoutes = require('./routes/external-integrations');
const featureFlagsRoutes = require('./routes/feature-flags');
const gameStatesRoutes = require('./routes/game-states');
const pushNotificationsRoutes = require('./routes/push-notifications');
const spacedRepetitionRoutes = require('./routes/spaced-repetition');
const testMetadataRoutes = require('./routes/test-metadata');
const userPreferencesRoutes = require('./routes/user-preferences');


// --- Uso de Rutas ---
// FIX: Registrar TODAS las rutas importadas.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/daily-quests', dailyQuestsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/creators-panel', creatorsPanelRoutes);
app.use('/api/oposiciones', oposicionesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/teachers-panel', teachersPanelRoutes);
app.use('/api/messages', directMessagingRoutes); // Ruta para mensajes directos
app.use('/api/gamificacion', gamificacionRoutes);
app.use('/api/luminarias', luminariasRoutes);
app.use('/api/adaptive-difficulty', adaptiveDifficultyRoutes);
app.use('/api/ai-analytics', aiAnalyticsRoutes);
app.use('/api/challenges-advanced', challengesAdvancedRoutes);
app.use('/api/external-integrations', externalIntegrationsRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);
app.use('/api/game-states', gameStatesRoutes);
app.use('/api/push-notifications', pushNotificationsRoutes);
app.use('/api/spaced-repetition', spacedRepetitionRoutes);
app.use('/api/test-metadata', testMetadataRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);


// --- Endpoints de Estado y Errores ---
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// --- ARRANQUE DEL SERVIDOR Y PUNTO ÚNICO DE INICIALIZACIÓN ---
async function startServer() {
    try {
        // PASO 2: Inicializar la base de datos UNA SOLA VEZ.
        console.log('--- INICIANDO PROCESO DE ARRANQUE DEL SERVIDOR ---');
        await db.initialize();

        // Ahora que la DB está lista, podemos configurar y arrancar el servidor HTTP.
        server.listen(PORT, async () => {
            console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
            
            // PASO 3: Ejecutar tareas de arranque que dependen de la base de datos.
            try {
                console.log('🔧 Ejecutando tareas de post-arranque (migraciones, auto-setup)...');
                const { runMigrations } = require('./auto-migrate');
                const autoSetup = require('./auto-setup');

                await runMigrations();
                await autoSetup.runAutoSetup();

                console.log('✅ Tareas de post-arranque completadas.');
            } catch (startupTaskError) {
                console.error('❌ Error durante las tareas de post-arranque:', startupTaskError);
            }
        });

    } catch (error) {
        console.error('💥 FATAL: Fallo crítico durante la inicialización del servidor. El proceso terminará.', error);
        process.exit(1);
    }
}

startServer();
