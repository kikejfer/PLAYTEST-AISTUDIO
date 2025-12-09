const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Este objeto actuará como un singleton para nuestro pool de la base de datos.
const db = {
    pool: null,
    initialized: false
};

/**
 * Inicializa el pool de conexiones de la base de datos.
 * Solo se debe llamar UNA VEZ al arrancar el servidor.
 * @returns {Promise<void>}
 */
async function initialize() {
    if (db.initialized) {
        console.log('DB Pool ya está inicializado.');
        return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ FATAL: DATABASE_URL no está definida. El servidor no puede arrancar.');
        process.exit(1);
    }

    console.log('🔧 Inicializando pool de la base de datos...');

    const config = {
        connectionString: databaseUrl,
    };

    // La configuración SSL es compleja y depende del entorno.
    // En Render, la URL suele manejar SSL. Para Aiven, puede requerir el `ca.pem`.
    if (databaseUrl.includes('sslmode=no-verify')) {
        config.ssl = { rejectUnauthorized: false };
        console.log('   ... modo SSL: no-verify (usado para Aiven self-signed certs)');
    } else if (process.env.NODE_ENV === 'production') {
        const caPath = path.join(__dirname, 'ca.pem');
        if (fs.existsSync(caPath)) {
            console.log('   ... modo SSL: production con ca.pem');
            config.ssl = {
                ca: fs.readFileSync(caPath).toString(),
                rejectUnauthorized: true,
            };
        } else {
             console.log('   ... modo SSL: production por defecto (sin ca.pem encontrado)');
             config.ssl = { rejectUnauthorized: false }; // Ajuste común para PaaS como Render/Heroku
        }
    }
    // En desarrollo (local), normalmente no se necesita SSL.

    db.pool = new Pool(config);

    try {
        const client = await db.pool.connect();
        console.log('✅ Pool de la base de datos conectado y listo.');
        client.release();
        db.initialized = true;
    } catch (error) {
        console.error('❌ FATAL: No se pudo conectar al pool de la base de datos al inicializar:', error);
        // Si no podemos conectar al inicio, es un error fatal.
        process.exit(1);
    }
}

/**
 * Devuelve la instancia del pool de conexiones.
 * Lanza un error si el pool no ha sido inicializado.
 * @returns {import('pg').Pool}
 */
function getPool() {
    if (!db.initialized || !db.pool) {
        // Este error NO debería ocurrir nunca si el server.js está bien configurado.
        throw new Error('El pool de la base de datos no ha sido inicializado. Llama a initialize() primero.');
    }
    return db.pool;
}

module.exports = {
    initialize,
    getPool
};
