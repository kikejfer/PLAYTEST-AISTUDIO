const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../database/connection');

// Controladores
const oposicionesController = require('../controllers/oposicionesController');
const bloquesTemaController = require('../controllers/bloquesTemaController');
const cronogramaController = require('../controllers/cronogramaController');
const comentariosController = require('../controllers/comentariosController');

// ==========================================
// MIDDLEWARE: Verificar rol de profesor
// ==========================================
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

        req.user.isTeacher = true;
        next();
    } catch (error) {
        console.error('Error verificando rol de profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ==========================================
// RUTAS: OPOSICIONES
// ==========================================

/**
 * POST /api/oposiciones
 * Crear nueva oposición
 */
router.post('/', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.crearOposicion(req.user.id, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones
 * Obtener oposiciones del profesor
 */
router.get('/', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { is_active = true } = req.query;
        const result = await oposicionesController.obtenerMisOposiciones(req.user.id, { is_active });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo oposiciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:id
 * Obtener detalle de una oposición
 */
router.get('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.obtenerDetalleOposicion(req.user.id, req.params.id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo detalle de oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/oposiciones/:id
 * Actualizar oposición
 */
router.put('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.actualizarOposicion(req.user.id, req.params.id, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error actualizando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/oposiciones/:id
 * Desactivar oposición (soft delete)
 */
router.delete('/:id', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await oposicionesController.desactivarOposicion(req.user.id, req.params.id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error desactivando oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/oposiciones/inscribir
 * Inscribir alumno en oposición usando código de acceso
 */
router.post('/inscribir', authenticateToken, async (req, res) => {
    try {
        const { codigo_acceso } = req.body;

        if (!codigo_acceso) {
            return res.status(400).json({ error: 'Código de acceso requerido' });
        }

        const result = await oposicionesController.inscribirAlumno(req.user.id, codigo_acceso);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error inscribiendo alumno:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:id/alumnos
 * Obtener alumnos de una oposición
 */
router.get('/:id/alumnos', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { estado = 'all' } = req.query;
        const result = await oposicionesController.obtenerAlumnosOposicion(req.user.id, req.params.id, { estado });

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo alumnos de oposición:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: BLOQUES Y TEMAS
// ==========================================

/**
 * POST /api/oposiciones/:oposicionId/bloques
 * Crear nuevo bloque de temas
 */
router.post('/:oposicionId/bloques', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.crearBloque(req.user.id, req.params.oposicionId, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:oposicionId/bloques
 * Obtener bloques de una oposición
 */
router.get('/:oposicionId/bloques', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.obtenerBloques(req.user.id, req.params.oposicionId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo bloques:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/bloques/:bloqueId
 * Obtener detalle de un bloque
 */
router.get('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.obtenerDetalleBloque(req.user.id, req.params.bloqueId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo detalle de bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/bloques/:bloqueId
 * Actualizar bloque
 */
router.put('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.actualizarBloque(req.user.id, req.params.bloqueId, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error actualizando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/bloques/:bloqueId
 * Eliminar bloque
 */
router.delete('/bloques/:bloqueId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.eliminarBloque(req.user.id, req.params.bloqueId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error eliminando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/bloques/:bloqueId/temas
 * Crear nuevo tema dentro de un bloque
 */
router.post('/bloques/:bloqueId/temas', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.crearTema(req.user.id, req.params.bloqueId, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/temas/:temaId
 * Actualizar tema
 */
router.put('/temas/:temaId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.actualizarTema(req.user.id, req.params.temaId, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error actualizando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/temas/:temaId
 * Eliminar tema
 */
router.delete('/temas/:temaId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.eliminarTema(req.user.id, req.params.temaId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error eliminando tema:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/bloques/:bloqueId/recalcular-totales
 * Recalcular totales de preguntas de un bloque
 */
router.post('/bloques/:bloqueId/recalcular-totales', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await bloquesTemaController.recalcularTotalesBloque(req.params.bloqueId);

        res.json(result);
    } catch (error) {
        console.error('Error recalculando totales:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/bloques/:bloqueId/preguntas-adaptativas
 * Obtener preguntas de un bloque con información de dominio para sistema adaptativo
 */
router.get('/bloques/:bloqueId/preguntas-adaptativas', authenticateToken, async (req, res) => {
    try {
        const alumnoId = req.user.id;
        const { bloqueId } = req.params;

        // Verificar que el alumno tiene acceso al bloque (está inscrito y el bloque está habilitado)
        const accessCheck = await pool.query(`
            SELECT cb.habilitado
            FROM cronograma_bloques cb
            JOIN cronograma_alumno ca ON cb.cronograma_id = ca.id
            WHERE ca.alumno_id = $1
              AND cb.bloque_id = $2
        `, [alumnoId, bloqueId]);

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'No tienes acceso a este bloque'
            });
        }

        if (!accessCheck.rows[0].habilitado) {
            return res.status(403).json({
                error: 'Este bloque aún no está habilitado en tu cronograma'
            });
        }

        // Obtener preguntas del bloque con información de dominio
        const preguntasResult = await pool.query(`
            SELECT
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer,
                q.explanation,
                q.tema_id,
                t.nombre as tema_nombre,
                COALESCE(dp.intentos_totales, 0) as intentos_totales,
                COALESCE(dp.aciertos, 0) as aciertos,
                COALESCE(dp.porcentaje_acierto, 0) as porcentaje_acierto,
                COALESCE(dp.es_dominada, false) as es_dominada,
                dp.ultima_respuesta_correcta
            FROM questions q
            JOIN temas t ON q.tema_id = t.id
            LEFT JOIN dominio_preguntas dp ON q.id = dp.pregunta_id AND dp.alumno_id = $1
            WHERE t.bloque_id = $2
            ORDER BY q.id
        `, [alumnoId, bloqueId]);

        res.json({
            success: true,
            preguntas: preguntasResult.rows
        });

    } catch (error) {
        console.error('Error obteniendo preguntas adaptativas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: CRONOGRAMA
// ==========================================

/**
 * POST /api/oposiciones/:oposicionId/cronograma
 * Generar cronograma para un alumno
 */
router.post('/:oposicionId/cronograma', authenticateToken, async (req, res) => {
    try {
        const { fecha_objetivo } = req.body;

        if (!fecha_objetivo) {
            return res.status(400).json({ error: 'Fecha objetivo requerida' });
        }

        const result = await cronogramaController.generarCronograma(
            req.user.id,
            req.params.oposicionId,
            fecha_objetivo
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error generando cronograma:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:oposicionId/cronograma
 * Obtener cronograma del alumno
 */
router.get('/:oposicionId/cronograma', authenticateToken, async (req, res) => {
    try {
        const result = await cronogramaController.obtenerCronogramaAlumno(req.user.id, req.params.oposicionId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo cronograma:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/oposiciones/:oposicionId/cronograma/fecha-objetivo
 * Actualizar fecha objetivo y recalcular cronograma
 */
router.put('/:oposicionId/cronograma/fecha-objetivo', authenticateToken, async (req, res) => {
    try {
        const { nueva_fecha_objetivo } = req.body;

        if (!nueva_fecha_objetivo) {
            return res.status(400).json({ error: 'Nueva fecha objetivo requerida' });
        }

        const result = await cronogramaController.actualizarFechaObjetivo(
            req.user.id,
            req.params.oposicionId,
            nueva_fecha_objetivo
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error actualizando fecha objetivo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/oposiciones/:oposicionId/cronograma/habilitar-siguiente
 * Habilitar siguiente bloque manualmente
 */
router.post('/:oposicionId/cronograma/habilitar-siguiente', authenticateToken, async (req, res) => {
    try {
        const result = await cronogramaController.habilitarSiguienteBloque(req.user.id, req.params.oposicionId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error habilitando siguiente bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:oposicionId/cronogramas
 * Obtener todos los cronogramas de una oposición (para el profesor)
 */
router.get('/:oposicionId/cronogramas', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await cronogramaController.obtenerCronogramasOposicion(req.user.id, req.params.oposicionId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo cronogramas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==========================================
// RUTAS: COMENTARIOS PROFESOR
// ==========================================

/**
 * POST /api/comentarios
 * Crear comentario del profesor
 */
router.post('/comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { alumno_id, bloque_id, comentario } = req.body;

        if (!alumno_id || !bloque_id || !comentario) {
            return res.status(400).json({ error: 'alumno_id, bloque_id y comentario son requeridos' });
        }

        const result = await comentariosController.crearComentario(
            req.user.id,
            alumno_id,
            bloque_id,
            comentario
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/comentarios/alumno/:alumnoId/bloque/:bloqueId
 * Obtener comentarios de un alumno en un bloque
 */
router.get('/comentarios/alumno/:alumnoId/bloque/:bloqueId', authenticateToken, async (req, res) => {
    try {
        const result = await comentariosController.obtenerComentariosBloque(
            req.params.alumnoId,
            req.params.bloqueId
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/comentarios/alumno/:alumnoId
 * Obtener todos los comentarios de un alumno
 */
router.get('/comentarios/alumno/:alumnoId', authenticateToken, async (req, res) => {
    try {
        const { oposicion_id } = req.query;
        const result = await comentariosController.obtenerComentariosAlumno(
            req.params.alumnoId,
            oposicion_id || null
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo comentarios de alumno:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/comentarios/mis-comentarios
 * Obtener comentarios que ha hecho el profesor
 */
router.get('/comentarios/mis-comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { oposicion_id, alumno_id } = req.query;
        const result = await comentariosController.obtenerMisComentarios(
            req.user.id,
            oposicion_id || null,
            alumno_id || null
        );

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo mis comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/comentarios/:comentarioId
 * Actualizar comentario
 */
router.put('/comentarios/:comentarioId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const { comentario } = req.body;

        if (!comentario) {
            return res.status(400).json({ error: 'Comentario requerido' });
        }

        const result = await comentariosController.actualizarComentario(
            req.user.id,
            req.params.comentarioId,
            comentario
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error actualizando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/comentarios/:comentarioId
 * Eliminar comentario
 */
router.delete('/comentarios/:comentarioId', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await comentariosController.eliminarComentario(req.user.id, req.params.comentarioId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/oposiciones/:oposicionId/resumen-comentarios
 * Obtener resumen de comentarios por alumno
 */
router.get('/:oposicionId/resumen-comentarios', authenticateToken, requireTeacherRole, async (req, res) => {
    try {
        const result = await comentariosController.obtenerResumenComentariosPorAlumno(
            req.user.id,
            req.params.oposicionId
        );

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo resumen de comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
