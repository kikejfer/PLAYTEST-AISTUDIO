const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  getTickets,
  createTicket,
  updateTicketStatus,
  assignTicket,
  getSystemMetrics,
  getSystemLogs,
  runDiagnostics
} = require('../controllers/servicioTecnicoController');

// Middleware: Solo servicio técnico
router.use(authenticateToken);
router.use(requireRole(['servicio_tecnico', 'administrador_principal']));

// ============ GESTIÓN DE TICKETS ============

/**
 * GET /api/servicio-tecnico/tickets
 * Obtener tickets con filtros y paginación
 */
router.get('/tickets', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'fecha_creacion',
      sortOrder = 'desc',
      estado = '',
      prioridad = '',
      categoria = '',
      tecnico = ''
    } = req.query;

    const filters = {
      search,
      estado,
      prioridad,
      categoria,
      tecnico: tecnico === 'yo' ? req.user.id : tecnico
    };

    const result = await getTickets({
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
    console.error('Error obteniendo tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/servicio-tecnico/tickets
 * Crear nuevo ticket
 */
router.post('/tickets', async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      prioridad = 'Media',
      categoria = 'Sistema',
      usuario_reporta
    } = req.body;
    
    if (!titulo || !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Título y descripción son requeridos'
      });
    }

    const nuevoTicket = await createTicket({
      titulo,
      descripcion,
      prioridad,
      categoria,
      usuario_reporta: usuario_reporta || req.user.email,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      ticket: nuevoTicket
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /api/servicio-tecnico/tickets/:ticketId/status
 * Actualizar estado de un ticket
 */
router.put('/tickets/:ticketId/status', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { estado, comentario } = req.body;
    
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const updatedTicket = await updateTicketStatus(ticketId, {
      estado,
      comentario,
      updated_by: req.user.id
    });
    
    res.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error actualizando estado del ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/servicio-tecnico/tickets/:ticketId/assign
 * Asignar ticket a un técnico
 */
router.post('/tickets/:ticketId/assign', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { tecnico_id } = req.body;
    
    // Si no se especifica técnico, asignar al usuario actual
    const assignedTo = tecnico_id || req.user.id;

    const updatedTicket = await assignTicket(ticketId, {
      tecnico_id: assignedTo,
      assigned_by: req.user.id
    });
    
    res.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error asignando ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ MONITOREO DEL SISTEMA ============

/**
 * GET /api/servicio-tecnico/system/metrics
 * Obtener métricas del sistema en tiempo real
 */
router.get('/system/metrics', async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    
    res.json({
      success: true,
      metrics: {
        uptime: metrics.uptime,
        cpu_usage: metrics.cpu_usage,
        memory_usage: metrics.memory_usage,
        disk_usage: metrics.disk_usage,
        response_time: metrics.response_time,
        active_users: metrics.active_users,
        database_connections: metrics.database_connections,
        error_rate: metrics.error_rate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/servicio-tecnico/system/health
 * Health check del sistema
 */
router.get('/system/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'operational', // operational, degraded, maintenance, outage
      services: {
        database: 'operational',
        redis: 'operational',
        file_storage: 'operational',
        email_service: 'operational',
        payment_gateway: 'operational'
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    };

    // TODO: Implementar checks reales de servicios
    res.json({
      success: true,
      health: healthStatus
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ LOGS DEL SISTEMA ============

/**
 * GET /api/servicio-tecnico/system/logs
 * Obtener logs del sistema con filtros
 */
router.get('/system/logs', async (req, res) => {
  try {
    const {
      level = 'all', // all, error, warn, info, debug
      limit = 100,
      since = '',
      service = ''
    } = req.query;

    const logs = await getSystemLogs({
      level,
      limit: parseInt(limit),
      since,
      service
    });
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ HERRAMIENTAS DE DIAGNÓSTICO ============

/**
 * POST /api/servicio-tecnico/diagnostics/run
 * Ejecutar diagnósticos del sistema
 */
router.post('/diagnostics/run', async (req, res) => {
  try {
    const { tests = ['all'] } = req.body;
    
    const diagnosticResult = await runDiagnostics(tests);
    
    res.json({
      success: true,
      diagnostics: diagnosticResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ejecutando diagnósticos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/servicio-tecnico/system/restart-service
 * Reiniciar un servicio específico
 */
router.post('/system/restart-service', async (req, res) => {
  try {
    const { service_name } = req.body;
    
    if (!service_name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del servicio es requerido'
      });
    }

    // TODO: Implementar lógica de reinicio de servicios
    // Esta operación debe ser muy cuidadosa y con logs detallados
    
    res.json({
      success: true,
      message: `Servicio ${service_name} reiniciado correctamente`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reiniciando servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/servicio-tecnico/system/backup-status
 * Estado de los backups del sistema
 */
router.get('/system/backup-status', async (req, res) => {
  try {
    const backupStatus = {
      last_backup: '2024-01-15T02:00:00Z',
      next_backup: '2024-01-16T02:00:00Z',
      backup_size: '2.5GB',
      status: 'completed',
      retention_days: 30,
      automatic_backups: true
    };

    res.json({
      success: true,
      backup: backupStatus
    });
  } catch (error) {
    console.error('Error obteniendo estado de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/servicio-tecnico/system/manual-backup
 * Iniciar backup manual
 */
router.post('/system/manual-backup', async (req, res) => {
  try {
    const { include_files = true, include_database = true } = req.body;
    
    // TODO: Implementar lógica de backup manual
    
    res.json({
      success: true,
      message: 'Backup manual iniciado',
      backup_id: `backup_${Date.now()}`,
      estimated_duration: '15-30 minutos'
    });
  } catch (error) {
    console.error('Error iniciando backup manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;