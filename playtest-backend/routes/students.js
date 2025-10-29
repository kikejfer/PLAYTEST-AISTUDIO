const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
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

// ============ MIS GRUPOS ============

/**
 * GET /api/students/my-groups
 * Obtener grupos en los que el estudiante es miembro
 */
router.get('/my-groups', async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get groups where the student is a member
    const result = await pool.query(`
      SELECT
        g.id,
        g.name,
        g.description,
        g.access_code,
        g.created_at,
        u.nickname as teacher_name,
        u.email as teacher_email,
        gm.joined_at,
        gm.role_in_group,
        COUNT(DISTINCT gm2.user_id) as member_count,
        COUNT(DISTINCT ba.block_id) as assigned_blocks_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id
      LEFT JOIN block_assignments ba ON g.id = ba.group_id
      WHERE gm.user_id = $1
      GROUP BY g.id, g.name, g.description, g.access_code, g.created_at, u.nickname, u.email, gm.joined_at, gm.role_in_group
      ORDER BY gm.joined_at DESC
    `, [studentId]);

    res.json({
      success: true,
      groups: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo grupos del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus grupos',
      error: error.message
    });
  }
});

module.exports = router;
