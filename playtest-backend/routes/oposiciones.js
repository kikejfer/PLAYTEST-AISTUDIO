
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
// FIX: Import getPool instead of the direct pool object.
const { getPool } = require('../database/connection');

// Controladores (asumimos que estos ya usan getPool internamente)
const oposicionesController = require('../controllers/oposicionesController');
const bloquesTemaController = require('../controllers/bloquesTemaController');
const cronogramaController = require('../controllers/cronogramaController');
const comentariosController = require('../controllers/comentariosController');

// FIX: Add middleware to inject the database pool into the request.
const getDBPool = (req, res, next) => {
    try {
        req.pool = getPool();
        next();
    } catch (error) {
        console.error("Failed to get DB Pool in oposiciones.js", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
};

// FIX: Apply the middleware to all routes in this file.
router.use(getDBPool);


// ==========================================
// MIDDLEWARE: Verificar rol de profesor
// ==========================================
const requireTeacherRole = async (req, res, next) => {
    try {
        // FIX: Use the pool from the request object (req.pool).
        const teacherCheck = await req.pool.query(`
            SELECT ur.id FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND r.name IN ('profesor', 'administrador_principal', 'administrador_secundario')
        `, [req.user.id]);

        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Acceso denegado: se requiere rol de profesor'
            });
        }

        req.user.isTeacher = true;
        next();
    } catch (error) {
        console.error('Error verificando rol de profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ... (el resto de las rutas no necesita cambios, ya que llaman a controladores
// que deberían estar usando el método getPool() actualizado)

// ==========================================
// RUTAS: OPOSICIONES
// ==========================================

router.post('/', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.crearOposicion(req.user.id, req.body);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { is_active = true } = req.query;
        const result = await oposicionesController.obtenerMisOposiciones(req.user.id, { is_active });
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo oposiciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.obtenerDetalleOposicion(req.user.id, req.params.id);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo detalle de oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.actualizarOposicion(req.user.id, req.params.id, req.body);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.desactivarOposicion(req.user.id, req.params.id);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error desactivando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/inscribir', authenticateToken, async (req, res) => {
    try {
        const { codigo_acceso } = req.body;
        if (!codigo_acceso) return res.status(400).json({ error: 'Código de acceso requerido' });
        const result = await oposicionesController.inscribirAlumno(req.user.id, codigo_acceso);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error inscribiendo alumno:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:id/alumnos', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { estado = 'all' } = req.query;
        const result = await oposicionesController.obtenerAlumnosOposicion(req.user.id, req.params.id, { estado });
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo alumnos de oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: BLOQUES Y TEMAS
// ==========================================

router.post('/:oposicionId/bloques', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.crearBloque(req.user.id, req.params.oposicionId, req.body);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:oposicionId/bloques', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.obtenerBloques(req.user.id, req.params.oposicionId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo bloques:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.obtenerDetalleBloque(req.user.id, req.params.bloqueId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo detalle de bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.actualizarBloque(req.user.id, req.params.bloqueId, req.body);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.eliminarBloque(req.user.id, req.params.bloqueId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/bloques/:bloqueId/temas', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.crearTema(req.user.id, req.params.bloqueId, req.body);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/temas/:temaId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.actualizarTema(req.user.id, req.params.temaId, req.body);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/temas/:temaId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.eliminarTema(req.user.id, req.params.temaId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/bloques/:bloqueId/recalcular-totales', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.recalcularTotalesBloque(req.params.bloqueId);
        res.json(result);
    } catch (error) {
        console.error('Error recalculando totales:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/bloques/:bloqueId/preguntas-adaptativas', authenticateToken, async (req, res) => {
    try {
        const alumnoId = req.user.id;
        const { bloqueId } = req.params;

        const accessCheck = await req.pool.query(`
            SELECT cb.habilitado
            FROM cronograma_bloques cb
            JOIN cronograma_alumno ca ON cb.cronograma_id = ca.id
            WHERE ca.alumno_id = $1
              AND cb.bloque_id = $2
        `, [alumnoId, bloqueId]);

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a este bloque' });
        }

        if (!accessCheck.rows[0].habilitado) {
            return res.status(403).json({ error: 'Este bloque aún no está habilitado en tu cronograma' });
        }

        const preguntasResult = await req.pool.query(`
            SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation, q.tema_id, t.nombre as tema_nombre,
                   COALESCE(dp.intentos_totales, 0) as intentos_totales, COALESCE(dp.aciertos, 0) as aciertos, COALESCE(dp.porcentaje_acierto, 0) as porcentaje_acierto,
                   COALESCE(dp.es_dominada, false) as es_dominada, dp.ultima_respuesta_correcta
            FROM questions q
            JOIN temas t ON q.tema_id = t.id
            LEFT JOIN dominio_preguntas dp ON q.id = dp.pregunta_id AND dp.alumno_id = $1
            WHERE t.bloque_id = $2
            ORDER BY q.id
        `, [alumnoId, bloqueId]);

        res.json({ success: true, preguntas: preguntasResult.rows });
    } catch (error) {
        console.error('Error obteniendo preguntas adaptativas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// ==========================================
// RUTAS: CRONOGRAMA
// ==========================================

router.post('/:oposicionId/cronograma', authenticateToken, async (req, res) => {
    try {
        const { fecha_objetivo } = req.body;
        if (!fecha_objetivo) return res.status(400).json({ error: 'Fecha objetivo requerida' });
        const result = await cronogramaController.generarCronograma(req.user.id, req.params.oposicionId, fecha_objetivo);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error generando cronograma:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:oposicionId/cronograma', authenticateToken, async (req, res) => {
    try {
        const result = await cronogramaController.obtenerCronogramaAlumno(req.user.id, req.params.oposicionId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo cronograma:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/:oposicionId/cronograma/fecha-objetivo', authenticateToken, async (req, res) => {
    try {
        const { nueva_fecha_objetivo } = req.body;
        if (!nueva_fecha_objetivo) return res.status(400).json({ error: 'Nueva fecha objetivo requerida' });
        const result = await cronogramaController.actualizarFechaObjetivo(req.user.id, req.params.oposicionId, nueva_fecha_objetivo);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando fecha objetivo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:oposicionId/cronograma/habilitar-siguiente', authenticateToken, async (req, res) => {
    try {
        const result = await cronogramaController.habilitarSiguienteBloque(req.user.id, req.params.oposicionId);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error habilitando siguiente bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:oposicionId/cronogramas', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await cronogramaController.obtenerCronogramasOposicion(req.user.id, req.params.oposicionId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo cronogramas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: COMENTARIOS PROFESOR
// ==========================================

router.post('/comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { alumno_id, bloque_id, comentario } = req.body;
        if (!alumno_id || !bloque_id || !comentario) return res.status(400).json({ error: 'alumno_id, bloque_id y comentario son requeridos' });
        const result = await comentariosController.crearComentario(req.user.id, alumno_id, bloque_id, comentario);
        if (!result.success) return res.status(400).json(result);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/comentarios/alumno/:alumnoId/bloque/:bloqueId', authenticateToken, async (req, res) => {
    try {
        const result = await comentariosController.obtenerComentariosBloque(req.params.alumnoId, req.params.bloqueId);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/comentarios/alumno/:alumnoId', authenticateToken, async (req, res) => {
    try {
        const { oposicion_id } = req.query;
        const result = await comentariosController.obtenerComentariosAlumno(req.params.alumnoId, oposicion_id || null);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo comentarios de alumno:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/comentarios/mis-comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { oposicion_id, alumno_id } = req.query;
        const result = await comentariosController.obtenerMisComentarios(req.user.id, oposicion_id || null, alumno_id || null);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo mis comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.put('/comentarios/:comentarioId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { comentario } = req.body;
        if (!comentario) return res.status(400).json({ error: 'Comentario requerido' });
        const result = await comentariosController.actualizarComentario(req.user.id, req.params.comentarioId, comentario);
        if (!result.success) return res.status(400).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/comentarios/:comentarioId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await comentariosController.eliminarComentario(req.user.id, req.params.comentarioId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:oposicionId/resumen-comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await comentariosController.obtenerResumenComentariosPorAlumno(req.user.id, req.params.oposicionId);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo resumen de comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
