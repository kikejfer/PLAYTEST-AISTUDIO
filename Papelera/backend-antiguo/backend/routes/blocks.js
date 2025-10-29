const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { loadBlock } = require('../controllers/studentsController');

// Middleware: Solo usuarios autenticados
router.use(authenticateToken);

// ============ CARGAR BLOQUES ============

/**
 * POST /api/blocks/:blockId/load
 * Cargar un bloque al perfil del usuario
 * Permite a estudiantes cargar bloques asignados
 */
router.post('/:blockId/load', async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockId } = req.params;

    if (!blockId || isNaN(parseInt(blockId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de bloque inválido'
      });
    }

    const result = await loadBlock(userId, parseInt(blockId));

    res.json({
      success: true,
      message: `Bloque "${result.block_name}" cargado exitosamente`,
      data: result
    });
  } catch (error) {
    console.error('Error cargando bloque:', error);

    if (error.message === 'Bloque no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'El bloque solicitado no existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al cargar el bloque',
      error: error.message
    });
  }
});

module.exports = router;
