const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  globalSearch,
  searchUsers,
  searchBlocks,
  searchQuestions,
  searchClasses,
  searchTournaments
} = require('../controllers/searchController');

// Middleware: Autenticación requerida
router.use(authenticateToken);

// ============ BÚSQUEDA GLOBAL ============

/**
 * GET /api/search/global
 * Búsqueda global con filtros por contexto
 */
router.get('/global', async (req, res) => {
  try {
    const {
      q = '', // Query string
      contexts = 'users,blocks,questions,classes,tournaments', // Contextos a buscar
      limit = 20,
      user_roles = ''
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const contextsArray = contexts.split(',').map(c => c.trim());
    const userRoles = req.user.roles || [];

    const searchResults = await globalSearch({
      query: q,
      contexts: contextsArray,
      limit: parseInt(limit),
      user_id: req.user.id,
      user_roles: userRoles
    });

    res.json({
      success: true,
      query: q,
      contexts: contextsArray,
      total_results: searchResults.length,
      results: searchResults
    });
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ BÚSQUEDAS ESPECÍFICAS ============

/**
 * GET /api/search/users
 * Búsqueda específica de usuarios
 */
router.get('/users', async (req, res) => {
  try {
    const {
      q = '',
      role = '',
      limit = 20,
      include_inactive = false
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const users = await searchUsers({
      query: q,
      role,
      limit: parseInt(limit),
      include_inactive: include_inactive === 'true',
      requesting_user: req.user
    });

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

/**
 * GET /api/search/blocks
 * Búsqueda específica de bloques
 */
router.get('/blocks', async (req, res) => {
  try {
    const {
      q = '',
      difficulty = '',
      category = '',
      author = '',
      limit = 20,
      public_only = true
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const blocks = await searchBlocks({
      query: q,
      difficulty,
      category,
      author,
      limit: parseInt(limit),
      public_only: public_only === 'true',
      user_id: req.user.id
    });

    res.json({
      success: true,
      blocks
    });
  } catch (error) {
    console.error('Error buscando bloques:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/search/questions
 * Búsqueda específica de preguntas
 */
router.get('/questions', async (req, res) => {
  try {
    const {
      q = '',
      block_id = '',
      difficulty = '',
      type = '',
      limit = 20
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const questions = await searchQuestions({
      query: q,
      block_id,
      difficulty,
      type,
      limit: parseInt(limit),
      user_id: req.user.id
    });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Error buscando preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/search/classes
 * Búsqueda específica de clases
 */
router.get('/classes', async (req, res) => {
  try {
    const {
      q = '',
      teacher = '',
      subject = '',
      active_only = true,
      limit = 20
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const classes = await searchClasses({
      query: q,
      teacher,
      subject,
      active_only: active_only === 'true',
      limit: parseInt(limit),
      user_id: req.user.id
    });

    res.json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('Error buscando clases:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/search/tournaments
 * Búsqueda específica de torneos
 */
router.get('/tournaments', async (req, res) => {
  try {
    const {
      q = '',
      status = '',
      category = '',
      limit = 20
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    const tournaments = await searchTournaments({
      query: q,
      status,
      category,
      limit: parseInt(limit),
      user_id: req.user.id
    });

    res.json({
      success: true,
      tournaments
    });
  } catch (error) {
    console.error('Error buscando torneos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ BÚSQUEDAS AVANZADAS ============

/**
 * POST /api/search/advanced
 * Búsqueda avanzada con múltiples filtros
 */
router.post('/advanced', async (req, res) => {
  try {
    const {
      query = '',
      filters = {},
      sort_by = 'relevance',
      sort_order = 'desc',
      limit = 50,
      offset = 0
    } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda de al menos 2 caracteres'
      });
    }

    // TODO: Implementar búsqueda avanzada con múltiples filtros
    const results = await globalSearch({
      query,
      contexts: ['users', 'blocks', 'questions', 'classes', 'tournaments'],
      limit: parseInt(limit),
      user_id: req.user.id,
      user_roles: req.user.roles || [],
      advanced_filters: filters,
      sort_by,
      sort_order,
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      query,
      filters,
      total_results: results.length,
      results
    });
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ SUGERENCIAS Y AUTOCOMPLETAR ============

/**
 * GET /api/search/suggestions
 * Obtener sugerencias para autocompletar
 */
router.get('/suggestions', async (req, res) => {
  try {
    const {
      q = '',
      context = 'all',
      limit = 10
    } = req.query;

    if (!q || q.length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // TODO: Implementar sistema de sugerencias
    // Por ahora devolvemos sugerencias mock
    const mockSuggestions = [
      { text: `${q} historia`, type: 'category', count: 45 },
      { text: `${q} matemáticas`, type: 'category', count: 32 },
      { text: `${q} ciencias`, type: 'category', count: 28 },
      { text: `profesor ${q}`, type: 'user', count: 12 },
      { text: `bloque ${q}`, type: 'content', count: 18 }
    ].slice(0, parseInt(limit));

    res.json({
      success: true,
      query: q,
      suggestions: mockSuggestions
    });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/search/recent
 * Obtener búsquedas recientes del usuario
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // TODO: Implementar sistema de búsquedas recientes
    // Por ahora devolvemos datos mock
    const recentSearches = [
      {
        query: 'historia mundial',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        results_count: 25,
        context: 'blocks'
      },
      {
        query: 'profesor garcía',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        results_count: 3,
        context: 'users'
      },
      {
        query: 'matemáticas básicas',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        results_count: 18,
        context: 'questions'
      }
    ].slice(0, parseInt(limit));

    res.json({
      success: true,
      recent_searches: recentSearches
    });
  } catch (error) {
    console.error('Error obteniendo búsquedas recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;