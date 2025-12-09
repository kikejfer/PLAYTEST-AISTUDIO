const { getPool } = require('../database/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    const { nickname, email, password } = req.body;
    if (!nickname || !email || !password) {
        return res.status(400).json({ error: 'Nickname, email, and password are required.' });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userExists = await client.query('SELECT 1 FROM users WHERE email = $1 OR nickname = $2', [email, nickname]);
        if (userExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'User with that email or nickname already exists.' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await client.query(
            'INSERT INTO users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [nickname, email, hashedPassword]
        );
        const newUserId = newUser.rows[0].id;

        await client.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [newUserId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during registration transaction:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    } finally {
        client.release();
    }
};

const loginUser = async (req, res) => {
    const { nickname, password } = req.body;
    if (!nickname || !password) {
        return res.status(400).json({ error: 'Nickname and password are required.' });
    }

    const pool = getPool();

    try {
        const result = await pool.query('SELECT * FROM users WHERE nickname = $1', [nickname]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const rolesResult = await pool.query(
            'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1',
            [user.id]
        );
        const userRoles = rolesResult.rows.map(r => r.name);

        const payload = {
            id: user.id,
            nickname: user.nickname,
            roles: userRoles
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ token, user: { id: user.id, nickname: user.nickname, roles: userRoles } });

    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { registerUser, loginUser };
