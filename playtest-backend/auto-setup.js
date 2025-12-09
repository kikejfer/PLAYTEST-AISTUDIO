const bcrypt = require('bcrypt');
// PASO 1: Importar el *método* para obtener la conexión, no la conexión en sí.
const { getPool } = require('./database/connection');

class AutoSetup {
    constructor() {
        this.setupCompleted = false;
    }

    // ELIMINADO: El método initialize() ya no es necesario.

    async ensureAdminPrincipalExists() {
        // PASO 2: Obtener la conexión oficial justo cuando se necesita.
        const pool = getPool();
        try {
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE nickname = $1',
                ['AdminPrincipal']
            );
            
            let userId;
            if (existingUser.rows.length > 0) {
                console.log('✅ AdminPrincipal user already exists.');
                userId = existingUser.rows[0].id;
            } else {
                console.log('🔧 AdminPrincipal user not found. Creating...');
                const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'kikejfer', 12);
                const result = await pool.query(
                    'INSERT INTO users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                    ['AdminPrincipal', 'admin@playtest.com', passwordHash]
                );
                userId = result.rows[0].id;
                console.log(`✅ AdminPrincipal user created with ID: ${userId}`);
            }
            
            // Asegurar que el perfil de usuario existe
            const profileCheck = await pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
            if (profileCheck.rows.length === 0) {
                await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [userId]);
                console.log(`✅ User profile created for AdminPrincipal.`);
            }

            await this.ensureAdminPrincipalRole(userId);

        } catch (error) {
            console.error('❌ Error during AdminPrincipal setup:', error.message);
            // No relanzamos el error para no detener el arranque por completo si esto falla.
        }
    }

    async ensureAdminPrincipalRole(userId) {
        const pool = getPool();
        try {
            const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['administrador_principal']);
            let adminRoleId;

            if (roleResult.rows.length === 0) {
                const newRole = await pool.query('INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id', ['administrador_principal', 'Full system access']);
                adminRoleId = newRole.rows[0].id;
            } else {
                adminRoleId = roleResult.rows[0].id;
            }
            
            const assignmentCheck = await pool.query('SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, adminRoleId]);
            if (assignmentCheck.rows.length === 0) {
                await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, adminRoleId]);
                console.log('✅ AdminPrincipal role assigned.');
            }
        } catch (error) {
            console.warn('⚠️ Warning during AdminPrincipal role setup:', error.message);
        }
    }

    async runAutoSetup() {
        if (this.setupCompleted) {
            return;
        }
        console.log('🚀 Running AutoSetup...');
        await this.ensureAdminPrincipalExists();
        this.setupCompleted = true;
        console.log('✅ AutoSetup finished.');
    }
}

// Exportar una única instancia (singleton)
const autoSetup = new AutoSetup();
module.exports = autoSetup;
