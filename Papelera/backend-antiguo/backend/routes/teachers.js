const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    createClass,
    getMyClasses,
    getClassById,
    updateClass,
    deleteClass,
    assignBlockToClass,
    getClassBlocks,
    removeBlockFromClass,
    getClassStudents,
    getClassProgress
} = require('../controllers/teachersController');

// Middleware: Solo usuarios autenticados con rol profesor
router.use(authenticateToken);

// ============ GESTIÓN DE CLASES ============

/**
 * POST /api/teachers/classes
 * Crear nueva clase
 * Body: { class_name, subject, grade_level, academic_year, semester, max_students, class_room, start_date, end_date }
 */
router.post('/classes', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const classData = req.body;

        // Validaciones básicas
        if (!classData.class_name || !classData.subject) {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la clase y la materia son requeridos'
            });
        }

        const result = await createClass(teacherId, classData);

        res.status(201).json({
            success: true,
            message: `Clase "${result.class.class_name}" creada exitosamente`,
            class: result.class
        });

    } catch (error) {
        console.error('Error creando clase:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear la clase'
        });
    }
});

/**
 * GET /api/teachers/classes
 * Obtener todas las clases del profesor
 * Query params: ?is_active=true&academic_year=2024
 */
router.get('/classes', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const filters = {
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : true,
            academic_year: req.query.academic_year || null
        };

        const classes = await getMyClasses(teacherId, filters);

        res.json({
            success: true,
            classes
        });

    } catch (error) {
        console.error('Error obteniendo clases:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener las clases'
        });
    }
});

/**
 * GET /api/teachers/classes/:classId
 * Obtener detalles de una clase específica
 */
router.get('/classes/:classId', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const classData = await getClassById(parseInt(classId), teacherId);

        res.json({
            success: true,
            class: classData
        });

    } catch (error) {
        console.error('Error obteniendo clase:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al obtener la clase'
        });
    }
});

/**
 * PUT /api/teachers/classes/:classId
 * Actualizar clase
 * Body: { class_name, subject, grade_level, etc... }
 */
router.put('/classes/:classId', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;
        const updateData = req.body;

        const result = await updateClass(parseInt(classId), teacherId, updateData);

        res.json({
            success: true,
            message: 'Clase actualizada exitosamente',
            class: result.class
        });

    } catch (error) {
        console.error('Error actualizando clase:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al actualizar la clase'
        });
    }
});

/**
 * DELETE /api/teachers/classes/:classId
 * Eliminar clase (soft delete)
 */
router.delete('/classes/:classId', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const result = await deleteClass(parseInt(classId), teacherId);

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error eliminando clase:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al eliminar la clase'
        });
    }
});

// ============ ASIGNACIÓN DE BLOQUES ============

/**
 * POST /api/teachers/classes/:classId/assign-block
 * Asignar bloque a una clase
 * Body: { block_id, content_type, due_date, instructions }
 */
router.post('/classes/:classId/assign-block', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;
        const assignmentData = req.body;

        if (!assignmentData.block_id) {
            return res.status(400).json({
                success: false,
                error: 'El ID del bloque es requerido'
            });
        }

        const result = await assignBlockToClass(
            parseInt(classId),
            teacherId,
            assignmentData
        );

        res.status(201).json({
            success: true,
            message: `Bloque "${result.block_name}" asignado exitosamente`,
            assignment: result.assignment
        });

    } catch (error) {
        console.error('Error asignando bloque:', error);
        const statusCode = error.message.includes('no encontrada') || error.message.includes('no encontrado') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al asignar el bloque'
        });
    }
});

/**
 * GET /api/teachers/classes/:classId/blocks
 * Obtener bloques asignados a una clase
 */
router.get('/classes/:classId/blocks', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const blocks = await getClassBlocks(parseInt(classId), teacherId);

        res.json({
            success: true,
            blocks
        });

    } catch (error) {
        console.error('Error obteniendo bloques de la clase:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al obtener los bloques'
        });
    }
});

/**
 * DELETE /api/teachers/assignments/:assignmentId
 * Remover asignación de bloque
 */
router.delete('/assignments/:assignmentId', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { assignmentId } = req.params;

        const result = await removeBlockFromClass(parseInt(assignmentId), teacherId);

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error removiendo asignación:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al remover la asignación'
        });
    }
});

// ============ GESTIÓN DE ESTUDIANTES ============

/**
 * GET /api/teachers/classes/:classId/students
 * Obtener estudiantes inscritos en una clase
 */
router.get('/classes/:classId/students', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const students = await getClassStudents(parseInt(classId), teacherId);

        res.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Error obteniendo estudiantes:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al obtener los estudiantes'
        });
    }
});

/**
 * GET /api/teachers/classes/:classId/progress
 * Obtener progreso de estudiantes en una clase
 */
router.get('/classes/:classId/progress', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId } = req.params;

        const progress = await getClassProgress(parseInt(classId), teacherId);

        res.json({
            success: true,
            progress
        });

    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Error al obtener el progreso'
        });
    }
});

module.exports = router;
