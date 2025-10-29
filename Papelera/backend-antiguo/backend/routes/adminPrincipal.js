const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  getAdministradoresSecundarios,
  createAdministradorSecundario,
  deleteAdministradorSecundario,
  getProfesoresCreadores,
  getBloquesProfesor,
  getTemasBloque,
  getPreguntasTema,
  getUsuariosJugadores,
  assignAdminToUser,
  massiveAssignAdmin,
  assignAdminToProfesor,
  searchUsers
} = require('../controllers/adminPrincipalController');

// Middleware: Solo administradores principales
router.use(authenticateToken);
router.use(requireRole(['administrador_principal']));

// ============ ADMINISTRADORES SECUNDARIOS ============

/**
 * GET /api/admin/administradores-secundarios
 * Obtener lista de administradores secundarios
 */
router.get('/administradores-secundarios', async (req, res) => {
  try {
    const administradores = await getAdministradoresSecundarios();
    res.json({
      success: true,
      administradores
    });
  } catch (error) {
    console.error('Error obteniendo administradores secundarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/administradores-secundarios
 * Crear nuevo administrador secundario
 */
router.post('/administradores-secundarios', async (req, res) => {
  try {
    const { user_id, nickname, email } = req.body;
    
    if (!user_id || !nickname || !email) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const nuevoAdmin = await createAdministradorSecundario({
      user_id,
      nickname,
      email,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      administrador: nuevoAdmin
    });
  } catch (error) {
    console.error('Error creando administrador secundario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * DELETE /api/admin/administradores-secundarios/:id
 * Eliminar administrador secundario
 */
router.delete('/administradores-secundarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteAdministradorSecundario(id);
    
    res.json({
      success: true,
      message: 'Administrador secundario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando administrador secundario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ PROFESORES/CREADORES ============

/**
 * GET /api/admin/profesores-creadores
 * Obtener lista de profesores/creadores
 */
router.get('/profesores-creadores', async (req, res) => {
  try {
    const profesores = await getProfesoresCreadores();
    res.json({
      success: true,
      profesores
    });
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/profesores/:profesorId/bloques
 * Obtener bloques de un profesor específico
 */
router.get('/profesores/:profesorId/bloques', async (req, res) => {
  try {
    const { profesorId } = req.params;
    const bloques = await getBloquesProfesor(profesorId);
    
    res.json({
      success: true,
      bloques
    });
  } catch (error) {
    console.error('Error obteniendo bloques del profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/bloques/:bloqueId/temas
 * Obtener temas de un bloque específico
 */
router.get('/bloques/:bloqueId/temas', async (req, res) => {
  try {
    const { bloqueId } = req.params;
    const temas = await getTemasBloque(bloqueId);
    
    res.json({
      success: true,
      temas
    });
  } catch (error) {
    console.error('Error obteniendo temas del bloque:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/temas/:temaId/preguntas
 * Obtener preguntas de un tema específico
 */
router.get('/temas/:temaId/preguntas', async (req, res) => {
  try {
    const { temaId } = req.params;
    const preguntas = await getPreguntasTema(temaId);
    
    res.json({
      success: true,
      preguntas
    });
  } catch (error) {
    console.error('Error obteniendo preguntas del tema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/profesores/:profesorId/assign-admin
 * Asignar administrador a un profesor
 */
router.post('/profesores/:profesorId/assign-admin', async (req, res) => {
  try {
    const { profesorId } = req.params;
    const { admin_id } = req.body;
    
    await assignAdminToProfesor(profesorId, admin_id);
    
    res.json({
      success: true,
      message: 'Administrador asignado correctamente'
    });
  } catch (error) {
    console.error('Error asignando administrador al profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ USUARIOS/JUGADORES ============

/**
 * GET /api/admin/usuarios-jugadores
 * Obtener lista de usuarios/jugadores con filtros y paginación
 */
router.get('/usuarios-jugadores', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'luminarias',
      sortOrder = 'desc',
      adminAsignado = '',
      bloquesMin = '',
      bloquesMax = '',
      luminariasMin = '',
      luminariasMax = ''
    } = req.query;

    const filters = {
      search,
      adminAsignado,
      bloquesMin: bloquesMin ? parseInt(bloquesMin) : null,
      bloquesMax: bloquesMax ? parseInt(bloquesMax) : null,
      luminariasMin: luminariasMin ? parseInt(luminariasMin) : null,
      luminariasMax: luminariasMax ? parseInt(luminariasMax) : null
    };

    const result = await getUsuariosJugadores({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error obteniendo usuarios/jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/usuarios/:userId/assign-admin
 * Asignar administrador a un usuario individual
 */
router.post('/usuarios/:userId/assign-admin', async (req, res) => {
  try {
    const { userId } = req.params;
    const { admin_id } = req.body;
    
    await assignAdminToUser(userId, admin_id);
    
    res.json({
      success: true,
      message: 'Administrador asignado correctamente'
    });
  } catch (error) {
    console.error('Error asignando administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/usuarios/massive-assign-admin
 * Reasignación masiva de administrador a múltiples usuarios
 */
router.post('/usuarios/massive-assign-admin', async (req, res) => {
  try {
    const { user_ids, admin_id } = req.body;
    
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una lista válida de IDs de usuario'
      });
    }

    const result = await massiveAssignAdmin(user_ids, admin_id);
    
    res.json({
      success: true,
      message: `${result.affectedCount} usuarios reasignados correctamente`,
      affectedCount: result.affectedCount
    });
  } catch (error) {
    console.error('Error en reasignación masiva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ BÚSQUEDA DE USUARIOS ============

/**
 * GET /api/admin/search-users
 * Buscar usuarios por nickname para asignación como administradores
 */
router.get('/search-users', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const users = await searchUsers(q);
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;