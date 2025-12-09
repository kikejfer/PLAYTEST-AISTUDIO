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

// --- Uso de Rutas ---
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
        // Si esto falla, la aplicación se detiene (comportamiento definido en connection.js)
        console.log('--- INICIANDO PROCESO DE ARRANQUE DEL SERVIDOR ---');
        await db.initialize();

        // Ahora que la DB está lista, podemos configurar y arrancar el servidor HTTP.
        server.listen(PORT, async () => {
            console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
            
            // PASO 3: Ejecutar tareas de arranque que dependen de la base de datos.
            // Estos módulos ahora obtendrán la conexión internamente a través de getPool().
            try {
                console.log('🔧 Ejecutando tareas de post-arranque (migraciones, auto-setup)...');
                const { runMigrations } = require('./auto-migrate');
                const autoSetup = require('./auto-setup');

                await runMigrations();
                await autoSetup.runAutoSetup(); // (Necesitará ser refactorizado)

                console.log('✅ Tareas de post-arranque completadas.');
            } catch (startupTaskError) {
                console.error('❌ Error durante las tareas de post-arranque:', startupTaskError);
                // No detenemos el servidor, pero registramos el fallo.
            }
        });

    } catch (error) {
        console.error('💥 FATAL: Fallo crítico durante la inicialización del servidor. El proceso terminará.', error);
        process.exit(1);
    }
}

startServer();
