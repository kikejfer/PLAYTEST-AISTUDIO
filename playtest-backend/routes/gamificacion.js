const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
// CORRECT: Get the getPool function to be able to inject it
const { getPool } = require('../database/connection');
// The controller will now need the pool passed to its methods
const gamificacionController = require('../controllers/gamificacionController');

// Middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in gamificacion.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// Apply middleware for pool injection and authentication to all routes
router.use(getDBPool, authenticateToken);

// Middleware to verify teacher role, now using req.pool
const requireTeacherRole = async (req, res, next) => {
    try {
        const teacherCheck = await req.pool.query(
            "SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name IN ('profesor', 'administrador_principal')",
            [req.user.id]
        );
        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        next();
    } catch (error) {
        console.error('Error verificando rol de profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ==========================================
// Simplified Routes (showing the fix pattern)
// ==========================================

// Get all available badges
router.get('/badges', async (req, res) => {
    try {
        // Pass the pool from the request to the controller
        const result = await gamificacionController.obtenerBadgesDisponibles(req.pool);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo badges:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Get badges for the authenticated student
router.get('/mis-badges', async (req, res) => {
    try {
        const { oposicion_id } = req.query;
        // Pass the pool from the request to the controller
        const result = await gamificacionController.obtenerBadgesAlumno(req.pool, req.user.id, oposicion_id);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo badges del alumno:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Get ranking for a specific "oposicion"
router.get('/ranking/:oposicionId', async (req, res) => {
    try {
        const { oposicionId } = req.params;
        // Pass the pool from the request to the controller
        const result = await gamificacionController.obtenerRanking(req.pool, oposicionId);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo ranking:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Create a tournament (for teachers)
router.post('/torneos', requireTeacherRole, async (req, res) => {
    try {
        // Pass the pool from the request to the controller
        const result = await gamificacionController.crearTorneo(req.pool, req.user.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando torneo:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router;
