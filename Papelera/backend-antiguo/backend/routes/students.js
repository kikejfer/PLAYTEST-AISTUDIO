const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getMyClasses,
  enrollInClass,
  getAssignedBlocks,
  getStudentProgress
} = require('../controllers/studentsController');

// Middleware: Solo usuarios autenticados con rol jugador
router.use(authenticateToken);

// ============ MIS CLASES ============

/**
 * GET /api/students/my-classes
 * Obtener clases en las que el estudiante está inscrito
 */
router.get('/my-classes', async (req, res) => {
  try {
    const studentId = req.user.id;

    const classes = await getMyClasses(studentId);

    res.json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('Error obteniendo clases del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus clases',
      error: error.message
    });
  }
});

// ============ INSCRIPCIÓN EN CLASES ============

/**
 * POST /api/students/enroll
 * Inscribir estudiante en una clase mediante código
 * Body: { class_code: string }
 */
router.post('/enroll', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { class_code } = req.body;

    if (!class_code) {
      return res.status(400).json({
        success: false,
        message: 'El código de clase es requerido'
      });
    }

    const result = await enrollInClass(studentId, class_code);

    res.status(201).json({
      success: true,
      message: `¡Te has inscrito exitosamente en ${result.class_name}!`,
      data: result
    });
  } catch (error) {
    console.error('Error inscribiendo estudiante en clase:', error);

    // Manejo de errores específicos
    const errorMessages = {
      'Código de clase inválido o clase no activa': 'El código ingresado no es válido o la clase no está activa',
      'Ya estás inscrito en esta clase': 'Ya estás inscrito en esta clase',
      'La clase ha alcanzado su capacidad máxima': 'Esta clase ha alcanzado su capacidad máxima de estudiantes'
    };

    res.status(400).json({
      success: false,
      message: errorMessages[error.message] || 'Error al inscribirse en la clase',
      error: error.message
    });
  }
});

// ============ BLOQUES ASIGNADOS ============

/**
 * GET /api/students/assigned-blocks
 * Obtener bloques asignados a las clases del estudiante
 */
router.get('/assigned-blocks', async (req, res) => {
  try {
    const studentId = req.user.id;

    const blocks = await getAssignedBlocks(studentId);

    res.json({
      success: true,
      blocks
    });
  } catch (error) {
    console.error('Error obteniendo bloques asignados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bloques asignados',
      error: error.message
    });
  }
});

// ============ PROGRESO ACADÉMICO ============

/**
 * GET /api/students/progress
 * Obtener progreso del estudiante en bloques asignados
 * Query params: ?classId=123 (opcional)
 */
router.get('/progress', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId } = req.query;

    const progress = await getStudentProgress(
      studentId,
      classId ? parseInt(classId) : null
    );

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error obteniendo progreso del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tu progreso académico',
      error: error.message
    });
  }
});

module.exports = router;
