const pool = require('../database/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User Registration
const registerUser = async (req, res) => {
    const { nickname, email, password } = req.body;

    // Basic validation
    if (!nickname || !email || !password) {
        return res.status(400).json({ error: 'Please provide nickname, email, and password' });
    }

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1 OR nickname = $2', [email, nickname]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'User with that email or nickname already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert new user
            const newUser = await client.query(
                'INSERT INTO users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                [nickname, email, hashedPassword]
            );
            const newUserId = newUser.rows[0].id;

            // Get default role 'jugador'
            const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['jugador']);

            if (roleResult.rows.length === 0) {
                const errorMessage = 'FATAL: Default role \'jugador\' not found in the roles table. Cannot assign a role to the new user.';
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
            const roleId = roleResult.rows[0].id;

            // Assign role to user
            await client.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [newUserId, roleId]
            );

            await client.query('COMMIT');
            
            // Redirect as per original mock logic, which simulates a successful registration
            res.redirect(302, '/first-steps.html');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error during registration transaction:', error);
            res.status(500).json({ error: 'Server error during registration', details: error.message });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error in registerUser (outer catch): ', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// User Login
const loginUser = async (req, res) => {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
        return res.status(400).json({ error: 'Please provide nickname and password' });
    }

    try {
        // Find user by nickname
        const result = await pool.query('SELECT * FROM users WHERE nickname = $1', [nickname]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // --- Successful Login ---

        // Get user roles (using a similar query to the middleware for consistency)
        const rolesResult = await pool.query(
          `SELECT
            COALESCE(
              (SELECT json_agg(json_build_object(
                'code', CASE r.name
                  WHEN 'administrador_principal' THEN 'ADP'
                  WHEN 'administrador_secundario' THEN 'ADS'
                  WHEN 'profesor' THEN 'PRF'
                  WHEN 'creador' THEN 'CRD'
                  WHEN 'usuario' THEN 'PJG'
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
                  WHEN 'usuario' THEN 'PJG'
                  WHEN 'jugador' THEN 'PJG'
                  WHEN 'soporte_tecnico' THEN 'PST'
                  ELSE 'PJG'
                END
              ))
              FROM user_roles ur
              JOIN roles r ON ur.role_id = r.id
              WHERE ur.user_id = $1
              ), '[]'::json
            ) as roles`,
          [user.id]
        );
        
        const userRoles = rolesResult.rows[0].roles;

        // Create JWT Payload
        const payload = {
            userId: user.id,
            nickname: user.nickname,
            roles: userRoles
        };

        // Sign the token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Send token and user info
        res.json({
            message: 'Login successful',
            token,
            user: payload
        });

    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    registerUser,
    loginUser
};