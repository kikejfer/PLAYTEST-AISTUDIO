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

// ============ BLOQUES ASIGNADOS DE UN ESTUDIANTE ESPECÍFICO ============

/**
 * GET /api/students/:studentId/assigned-blocks
 * Obtener bloques asignados a un estudiante específico (para profesores)
 */
router.get('/:studentId/assigned-blocks', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Verificar que el profesor tiene acceso a este estudiante (está en una de sus clases o grupos)
    const accessCheck = await pool.query(`
      SELECT DISTINCT 1
      FROM block_assignments ba
      WHERE ba.assigned_by = $1
        AND (ba.assigned_to_user = $2 OR ba.group_id IN (
          SELECT group_id FROM group_members WHERE user_id = $2
        ))
      LIMIT 1
    `, [teacherId, studentId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a los bloques de este estudiante'
      });
    }

    // Obtener bloques asignados al estudiante (individuales y de grupo)
    const result = await pool.query(`
      SELECT DISTINCT
        ba.id as assignment_id,
        ba.block_id,
        b.name as block_name,
        b.description,
        ba.due_date,
        ba.notes,
        ba.assigned_at,
        CASE
          WHEN ba.assigned_to_user IS NOT NULL THEN 'INDIVIDUAL'
          ELSE 'GROUP'
        END as assignment_type,
        g.name as group_name,
        u.nickname as assigned_by_nickname
      FROM block_assignments ba
      JOIN blocks b ON ba.block_id = b.id
      LEFT JOIN groups g ON ba.group_id = g.id
      LEFT JOIN users u ON ba.assigned_by = u.id
      WHERE ba.assigned_by = $1
        AND (
          ba.assigned_to_user = $2
          OR ba.group_id IN (SELECT group_id FROM group_members WHERE user_id = $2)
        )
      ORDER BY ba.assigned_at DESC
    `, [teacherId, studentId]);

    res.json({
      success: true,
      blocks: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo bloques asignados del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bloques asignados',
      error: error.message
    });
  }
});

// ============ OPOSICIONES - STUDENT PANEL ============

/**
 * GET /api/students/my-oposiciones
 * Obtener oposiciones en las que el estudiante está inscrito
 */
router.get('/my-oposiciones', async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT
        o.id,
        o.nombre_oposicion,
        o.descripcion,
        o.fecha_examen,
        o.codigo_acceso,
        ce.enrollment_status,
        ce.enrolled_at,
        ce.last_activity,
        ca.fecha_objetivo,
        ca.porcentaje_progreso,
        ca.estado,
        ca.diferencia_porcentual,
        ca.preguntas_dominadas,
        ca.total_preguntas_oposicion
      FROM class_enrollments ce
      JOIN oposiciones o ON ce.oposicion_id = o.id
      LEFT JOIN cronograma_alumno ca ON ce.oposicion_id = ca.oposicion_id AND ce.alumno_id = ca.alumno_id
      WHERE ce.alumno_id = $1 AND ce.enrollment_status = 'active' AND o.is_active = true
      ORDER BY ce.enrolled_at DESC
    `, [studentId]);

    res.json({
      success: true,
      oposiciones: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo oposiciones del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus oposiciones',
      error: error.message
    });
  }
});

/**
 * POST /api/students/registrar-respuesta
 * Registrar respuesta de alumno a pregunta (para sistema adaptativo)
 * Body: { pregunta_id, oposicion_id, tema_id, respuesta, correcta }
 */
router.post('/registrar-respuesta', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentId = req.user.id;
    const { pregunta_id, oposicion_id, tema_id, respuesta, correcta } = req.body;

    if (!pregunta_id || !oposicion_id || !respuesta || correcta === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // Registrar en game_scores (historial de respuestas)
    await client.query(`
      INSERT INTO game_scores (
        user_id,
        question_id,
        score,
        game_mode,
        created_at
      ) VALUES ($1, $2, $3, 'oposiciones', NOW())
    `, [studentId, pregunta_id, correcta ? 100 : 0]);

    // Actualizar o crear registro de dominio
    await client.query(`
      SELECT actualizar_dominio_pregunta($1, $2, $3)
    `, [studentId, pregunta_id, correcta]);

    // Actualizar última actividad
    await client.query(`
      UPDATE class_enrollments
      SET last_activity = NOW()
      WHERE alumno_id = $1 AND oposicion_id = $2
    `, [studentId, oposicion_id]);

    // Recalcular progreso del cronograma
    if (tema_id) {
      // Obtener bloque_id del tema
      const bloqueResult = await client.query(
        'SELECT bloque_id FROM temas WHERE id = $1',
        [tema_id]
      );

      if (bloqueResult.rows.length > 0) {
        const bloqueId = bloqueResult.rows[0].bloque_id;

        // Obtener total de preguntas dominadas en el bloque
        const dominadasResult = await client.query(`
          SELECT COUNT(DISTINCT dp.pregunta_id) as dominadas
          FROM dominio_preguntas dp
          JOIN questions q ON dp.pregunta_id = q.id
          WHERE dp.alumno_id = $1
            AND dp.es_dominada = true
            AND q.tema_id IN (SELECT id FROM temas WHERE bloque_id = $2)
        `, [studentId, bloqueId]);

        const preguntasDominadas = dominadasResult.rows[0].dominadas || 0;

        // Actualizar cronograma_bloques
        await client.query(`
          UPDATE cronograma_bloques cb
          SET preguntas_dominadas = $1,
              porcentaje_progreso = CASE
                WHEN total_preguntas_bloque > 0
                THEN (CAST($1 AS FLOAT) / total_preguntas_bloque) * 100
                ELSE 0
              END,
              updated_at = NOW()
          WHERE cb.bloque_id = $2
            AND cb.cronograma_id IN (
              SELECT id FROM cronograma_alumno WHERE alumno_id = $3 AND oposicion_id = $4
            )
        `, [preguntasDominadas, bloqueId, studentId, oposicion_id]);
      }
    }

    // Actualizar totales del cronograma general
    await client.query(`
      UPDATE cronograma_alumno ca
      SET preguntas_dominadas = (
            SELECT COUNT(DISTINCT dp.pregunta_id)
            FROM dominio_preguntas dp
            JOIN questions q ON dp.pregunta_id = q.id
            JOIN temas t ON q.tema_id = t.id
            JOIN bloques_temas bt ON t.bloque_id = bt.id
            WHERE dp.alumno_id = ca.alumno_id
              AND dp.es_dominada = true
              AND bt.oposicion_id = ca.oposicion_id
          ),
          porcentaje_progreso = CASE
            WHEN total_preguntas_oposicion > 0
            THEN (CAST((
              SELECT COUNT(DISTINCT dp.pregunta_id)
              FROM dominio_preguntas dp
              JOIN questions q ON dp.pregunta_id = q.id
              JOIN temas t ON q.tema_id = t.id
              JOIN bloques_temas bt ON t.bloque_id = bt.id
              WHERE dp.alumno_id = ca.alumno_id
                AND dp.es_dominada = true
                AND bt.oposicion_id = ca.oposicion_id
            ) AS FLOAT) / total_preguntas_oposicion) * 100
            ELSE 0
          END,
          updated_at = NOW()
      WHERE alumno_id = $1 AND oposicion_id = $2
    `, [studentId, oposicion_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Respuesta registrada exitosamente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar respuesta',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
