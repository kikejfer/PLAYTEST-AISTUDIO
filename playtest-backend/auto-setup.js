const bcrypt = require('bcrypt');
let pool;

class AutoSetup {
    constructor() {
        this.setupCompleted = false;
        this.pool = null;
    }

    initialize(dbPool) {
        if (!dbPool) {
            throw new Error("El pool de la base de datos es necesario para inicializar AutoSetup");
        }
        this.pool = dbPool;
        pool = dbPool; 
        console.log('🔧 AutoSetup inicializado con el pool de la base de datos.');
    }

    _getPool() {
        if (!this.pool) {
            throw new Error("AutoSetup no ha sido inicializado. El servidor debe llamar a .initialize(pool) antes de usarlo.");
        }
        return this.pool;
    }

    async ensureAdminPrincipalExists() {
        const currentPool = this._getPool();
        try {
            const existingUser = await currentPool.query(
                'SELECT id, nickname FROM users WHERE nickname = $1',
                ['AdminPrincipal']
            );
            
            let userId;
            if (existingUser.rows.length > 0) {
                console.log('✅ AdminPrincipal ya existe (ID:', existingUser.rows[0].id, ')');
                userId = existingUser.rows[0].id;
            } else {
                console.log('🔧 AdminPrincipal no existe. Creando automáticamente...');
                const passwordHash = await bcrypt.hash('kikejfer', 10);
                const result = await currentPool.query(
                    'INSERT INTO users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nickname',
                    ['AdminPrincipal', 'admin@playtest.com', passwordHash]
                );
                userId = result.rows[0].id;
                console.log('✅ AdminPrincipal creado con ID:', userId);
            }
            
            try {
                const profileCheck = await currentPool.query(
                    'SELECT id FROM user_profiles WHERE user_id = $1',
                    [userId]
                );
                if (profileCheck.rows.length === 0) {
                    await currentPool.query(
                        'INSERT INTO user_profiles (user_id) VALUES ($1)',
                        [userId]
                    );
                    console.log('✅ Perfil creado para AdminPrincipal');
                }
            } catch (profileError) {
                console.warn('⚠️ Error con perfil (no crítico):', profileError.message);
            }
            
            await this.ensureAdminPrincipalRole(userId);
            return { id: userId, nickname: 'AdminPrincipal' };
            
        } catch (error) {
            console.error('❌ Error en auto-setup de AdminPrincipal:', error.message);
            return null;
        }
    }

    async ensureAdminPrincipalRole(userId) {
        const currentPool = this._getPool();
        try {
            let adminRoleResult = await currentPool.query('SELECT id FROM roles WHERE name = $1', ['administrador_principal']);
            let adminRoleId;
            if (adminRoleResult.rows.length === 0) {
                const newRoleResult = await currentPool.query('INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id', ['administrador_principal', 'Administrador Principal del Sistema']);
                adminRoleId = newRoleResult.rows[0].id;
            } else {
                adminRoleId = adminRoleResult.rows[0].id;
            }
            
            const existingRoleAssignment = await currentPool.query('SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, adminRoleId]);
            if (existingRoleAssignment.rows.length === 0) {
                await currentPool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, adminRoleId]);
                console.log('✅ Rol administrador_principal asignado a AdminPrincipal');
            }
        } catch (error) {
            console.warn('⚠️ Error configurando rol de AdminPrincipal:', error.message);
        }
    }

    async runAutoSetup() {
        if (this.setupCompleted) return;
        const currentPool = this._getPool();

        try {
            console.log('🚀 Ejecutando configuración automática (Lazy Loaded)...');
            await currentPool.query('SELECT 1');
            await this.ensureAdminPrincipalExists();
            this.setupCompleted = true;
            console.log('✅ Configuración automática completada');
        } catch (error) {
            console.error('❌ Error en configuración automática:', error.message);
        }
    }

    async checkStatus() {
        const currentPool = this._getPool();
        try {
            const adminCheck = await currentPool.query('SELECT id FROM users WHERE nickname = $1', ['AdminPrincipal']);
            let hasAdminRole = false;
            if (adminCheck.rows.length > 0) {
                const roleCheck = await currentPool.query(`SELECT ur.id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'administrador_principal'`, [adminCheck.rows[0].id]);
                hasAdminRole = roleCheck.rows.length > 0;
            }
            return { adminPrincipalExists: adminCheck.rows.length > 0, hasAdminRole: hasAdminRole, setupCompleted: this.setupCompleted };
        } catch (error) {
            return { error: error.message };
        }
    }
}

const autoSetup = new AutoSetup();
module.exports = autoSetup;