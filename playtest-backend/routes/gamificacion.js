const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../database/connection');
const gamificacionController = require('../controllers/gamificacionController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Middleware para verificar rol de profesor
const requireTeacherRole = async (req, res, next) => {
    try {
        const teacherCheck = await pool.query(`
            SELECT ur.id FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND r.name IN ('profesor', 'administrador_principal', 'administrador_secundario')
        `, [req.user.id]);

        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Acceso denegado: se requiere rol de profesor'
            });
        }

        next();
    } catch (error) {
        console.error('Error verificando rol de profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ==========================================
// RUTAS: BADGES
// ==========================================

/**
 * GET /api/gamificacion/badges
 * Obtener todos los badges disponibles
 */
router.get('/badges', async (req, res) => {
    try {
        const result = await gamificacionController.obtenerBadgesDisponibles();
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo badges:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/gamificacion/mis-badges
 * Obtener badges del alumno autenticado
 * Query: ?oposicion_id=123
 */
router.get('/mis-badges', async (req, res) => {
    try {
        const { oposicion_id } = req.query;
        const result = await gamificacionController.obtenerBadgesAlumno(
            req.user.id,
            oposicion_id ? parseInt(oposicion_id) : null
        );
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo badges del alumno:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/gamificacion/verificar-badges
 * Verificar y otorgar badges automáticos
 * Body: { oposicion_id }
 */
router.post('/verificar-badges', async (req, res) => {
    try {
        const { oposicion_id } = req.body;

        if (!oposicion_id) {
            return res.status(400).json({ error: 'oposicion_id requerido' });
        }

        const result = await gamificacionController.verificarYOtorgarBadges(
            req.user.id,
            oposicion_id
        );

        res.json(result);
    } catch (error) {
        console.error('Error verificando badges:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: PUNTOS Y RANKING
// ==========================================

/**
 * POST /api/gamificacion/actualizar-puntos
 * Actualizar puntos del alumno autenticado
 * Body: { oposicion_id }
 */
router.post('/actualizar-puntos', async (req, res) => {
    try {
        const { oposicion_id } = req.body;

        if (!oposicion_id) {
            return res.status(400).json({ error: 'oposicion_id requerido' });
        }

        const result = await gamificacionController.actualizarPuntosAlumno(
            req.user.id,
            oposicion_id
        );

        res.json(result);
    } catch (error) {
        console.error('Error actualizando puntos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/gamificacion/ranking/:oposicionId
 * Obtener ranking de una oposición
 * Query: ?limite=50
 */
router.get('/ranking/:oposicionId', async (req, res) => {
    try {
        const { oposicionId } = req.params;
        const { limite } = req.query;

        const result = await gamificacionController.obtenerRanking(
            parseInt(oposicionId),
            limite ? parseInt(limite) : 50
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo ranking:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/gamificacion/mi-posicion/:oposicionId
 * Obtener posición del alumno autenticado en el ranking
 */
router.get('/mi-posicion/:oposicionId', async (req, res) => {
    try {
        const { oposicionId } = req.params;

        const result = await gamificacionController.obtenerPosicionAlumno(
            req.user.id,
            parseInt(oposicionId)
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo posición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: RACHAS
// ==========================================

/**
 * POST /api/gamificacion/actualizar-racha
 * Actualizar racha de estudio
 * Body: { oposicion_id }
 */
router.post('/actualizar-racha', async (req, res) => {
    try {
        const { oposicion_id } = req.body;

        if (!oposicion_id) {
            return res.status(400).json({ error: 'oposicion_id requerido' });
        }

        const result = await gamificacionController.actualizarRacha(
            req.user.id,
            oposicion_id
        );

        res.json(result);
    } catch (error) {
        console.error('Error actualizando racha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/gamificacion/mi-racha/:oposicionId
 * Obtener racha del alumno autenticado
 */
router.get('/mi-racha/:oposicionId', async (req, res) => {
    try {
        const { oposicionId } = req.params;

        const result = await gamificacionController.obtenerRacha(
            req.user.id,
            parseInt(oposicionId)
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo racha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: TORNEOS (PROFESORES)
// ==========================================

/**
 * POST /api/gamificacion/torneos
 * Crear torneo (solo profesores)
 * Body: { oposicion_id, nombre, descripcion, tipo, bloque_id, fecha_inicio, fecha_fin, max_participantes, num_preguntas, premios }
 */
router.post('/torneos', requireTeacherRole, async (req, res) => {
    try {
        const { oposicion_id, ...data } = req.body;

        if (!oposicion_id) {
            return res.status(400).json({ error: 'oposicion_id requerido' });
        }

        const result = await gamificacionController.crearTorneo(
            req.user.id,
            oposicion_id,
            data
        );

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando torneo:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * GET /api/gamificacion/torneos/:oposicionId
 * Obtener torneos de una oposición
 * Query: ?estado=activo
 */
router.get('/torneos/:oposicionId', async (req, res) => {
    try {
        const { oposicionId } = req.params;
        const { estado } = req.query;

        const result = await gamificacionController.obtenerTorneos(
            parseInt(oposicionId),
            estado ? { estado } : {}
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo torneos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/gamificacion/torneos/detalle/:torneoId
 * Obtener detalle de un torneo con participantes
 */
router.get('/torneos/detalle/:torneoId', async (req, res) => {
    try {
        const { torneoId } = req.params;

        const result = await gamificacionController.obtenerDetalleTorneo(
            parseInt(torneoId)
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo detalle de torneo:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ==========================================
// RUTAS: TORNEOS (ALUMNOS)
// ==========================================

/**
 * POST /api/gamificacion/torneos/:torneoId/inscribir
 * Inscribirse en un torneo
 */
router.post('/torneos/:torneoId/inscribir', async (req, res) => {
    try {
        const { torneoId } = req.params;

        const result = await gamificacionController.inscribirEnTorneo(
            req.user.id,
            parseInt(torneoId)
        );

        res.status(201).json(result);
    } catch (error) {
        console.error('Error inscribiendo en torneo:', error);
        res.status(400).json({
            error: 'Error al inscribirse',
            message: error.message
        });
    }
});

/**
 * POST /api/gamificacion/torneos/:torneoId/iniciar
 * Iniciar participación en torneo (obtener preguntas)
 */
router.post('/torneos/:torneoId/iniciar', async (req, res) => {
    try {
        const { torneoId } = req.params;

        const result = await gamificacionController.iniciarParticipacionTorneo(
            req.user.id,
            parseInt(torneoId)
        );

        res.json(result);
    } catch (error) {
        console.error('Error iniciando participación:', error);
        res.status(400).json({
            error: 'Error al iniciar torneo',
            message: error.message
        });
    }
});

/**
 * POST /api/gamificacion/torneos/finalizar/:participanteId
 * Finalizar participación en torneo (enviar respuestas)
 * Body: { respuestas: [{pregunta_id, respuesta, tiempo_segundos}] }
 */
router.post('/torneos/finalizar/:participanteId', async (req, res) => {
    try {
        const { participanteId } = req.params;
        const { respuestas } = req.body;

        if (!respuestas || !Array.isArray(respuestas)) {
            return res.status(400).json({ error: 'Respuestas requeridas' });
        }

        const result = await gamificacionController.finalizarParticipacionTorneo(
            parseInt(participanteId),
            respuestas
        );

        res.json(result);
    } catch (error) {
        console.error('Error finalizando participación:', error);
        res.status(400).json({
            error: 'Error al finalizar torneo',
            message: error.message
        });
    }
});

module.exports = router;
