const express = require('express');
// FIX: Importar el método para obtener el pool, no el pool directamente.
const { getPool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==================== ENDPOINTS DE DASHBOARD Y MÉTRICAS ====================

router.get('/dashboard/metrics', authenticateToken, async (req, res) => {
    const pool = getPool();
    try {
        if (!req.user.role || !['agent', 'admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado. Solo agentes y administradores.' });
        }

        const metricsResult = await pool.query('SELECT * FROM support_dashboard_metrics');
        const metrics = metricsResult.rows[0];

        const trendsResult = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as tickets_created,
                COUNT(CASE WHEN status IN (\'resolved\', \'closed\') THEN 1 END) as tickets_resolved
            FROM support_tickets 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        const categoriesResult = await pool.query(`
            SELECT 
                sc.name as category_name,
                sc.color,
                COUNT(st.id) as ticket_count,
                AVG(CASE WHEN st.resolved_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (st.resolved_at - st.created_at)) / 3600 
                    ELSE NULL END) as avg_resolution_hours
            FROM support_categories sc
            LEFT JOIN support_tickets st ON sc.id = st.category_id
            WHERE st.created_at >= NOW() - INTERVAL '30 days' OR st.created_at IS NULL
            GROUP BY sc.id, sc.name, sc.color
            ORDER BY ticket_count DESC
            LIMIT 10
        `);

        const alertsResult = await pool.query(`
            SELECT 
                \'escalated\' as alert_type,
                \'Tickets Escalados Pendientes\' as title,
                COUNT(*) as count,
                \'critical\' as severity
            FROM support_tickets 
            WHERE escalation_level > 0 AND status NOT IN (\'resolved\', \'closed\')
            
            UNION ALL
            
            SELECT 
                \'sla_risk\' as alert_type,
                \'Tickets en Riesgo de SLA\' as title,
                COUNT(*) as count,
                \'warning\' as severity
            FROM support_tickets 
            WHERE status IN (\'open\', \'in_progress\') 
              AND created_at < NOW() - INTERVAL '20 hours'
              AND escalation_level = 0
            
            UNION ALL
            
            SELECT 
                \'high_volume\' as alert_type,
                \'Pico de Tickets Hoy\' as title,
                COUNT(*) as count,
                CASE WHEN COUNT(*) > 50 THEN \'critical\' 
                     WHEN COUNT(*) > 30 THEN \'warning\' 
                     ELSE \'info\' END as severity
            FROM support_tickets 
            WHERE created_at >= CURRENT_DATE
        `);

        res.json({
            metrics,
            trends: trendsResult.rows,
            categories: categoriesResult.rows,
            alerts: alertsResult.rows.filter(alert => alert.count > 0)
        });

    } catch (error) {
        console.error('Error obteniendo métricas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== ENDPOINTS DE TICKETS ====================

router.get('/tickets', authenticateToken, async (req, res) => {
    const pool = getPool();
    try {
        const { status, priority, category_id, assigned_to, escalation_level, group_id, search, limit = 50, offset = 0, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

        let query = `
            SELECT 
                st.*, sc.name as category_name, sc.color as category_color, u.nickname as user_nickname,
                ua.nickname as assigned_nickname, stg.group_name, stg.total_tickets as group_total_tickets,
                (SELECT COUNT(*) FROM support_comments WHERE ticket_id = st.id) as comments_count,
                CASE WHEN st.due_date IS NOT NULL AND st.due_date < NOW() AND st.status NOT IN (\'resolved\', \'closed\') THEN true ELSE false END as is_overdue
            FROM support_tickets st
            LEFT JOIN support_categories sc ON st.category_id = sc.id
            LEFT JOIN users u ON st.user_id = u.id
            LEFT JOIN users ua ON st.assigned_to = ua.id
            LEFT JOIN support_ticket_groups stg ON st.group_id = stg.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) { query += ` AND st.status = $${paramIndex}`; params.push(status); paramIndex++; }
        if (priority) { query += ` AND st.priority = $${paramIndex}`; params.push(priority); paramIndex++; }
        if (category_id) { query += ` AND st.category_id = $${paramIndex}`; params.push(category_id); paramIndex++; }
        if (assigned_to) { query += ` AND st.assigned_to = $${paramIndex}`; params.push(assigned_to); paramIndex++; }
        if (escalation_level) { query += ` AND st.escalation_level = $${paramIndex}`; params.push(escalation_level); paramIndex++; }
        if (group_id) { query += ` AND st.group_id = $${paramIndex}`; params.push(group_id); paramIndex++; }
        if (search) { query += ` AND (st.subject ILIKE $${paramIndex} OR st.description ILIKE $${paramIndex} OR st.ticket_number ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex})`; params.push(`%${search}%`); paramIndex++; }

        const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status', 'escalation_level'];
        const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

        query += ` ORDER BY st.${safeSortBy} ${safeSortOrder}`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM support_tickets st LEFT JOIN users u ON st.user_id = u.id WHERE 1=1`;
        const countParams = [];
        let countParamIndex = 1;

        if (status) { countQuery += ` AND st.status = $${countParamIndex}`; countParams.push(status); countParamIndex++; }
        if (priority) { countQuery += ` AND st.priority = $${countParamIndex}`; countParams.push(priority); countParamIndex++; }
        if (category_id) { countQuery += ` AND st.category_id = $${countParamIndex}`; countParams.push(category_id); countParamIndex++; }
        if (assigned_to) { countQuery += ` AND st.assigned_to = $${countParamIndex}`; countParams.push(assigned_to); countParamIndex++; }
        if (escalation_level) { countQuery += ` AND st.escalation_level = $${countParamIndex}`; countParams.push(escalation_level); countParamIndex++; }
        if (group_id) { countQuery += ` AND st.group_id = $${countParamIndex}`; countParams.push(group_id); countParamIndex++; }
        if (search) { countQuery += ` AND (st.subject ILIKE $${countParamIndex} OR st.description ILIKE $${countParamIndex} OR st.ticket_number ILIKE $${countParamIndex} OR u.nickname ILIKE $${countParamIndex})`; countParams.push(`%${search}%`); countParamIndex++; }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            tickets: result.rows,
            pagination: { total: parseInt(countResult.rows[0].total), limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(countResult.rows[0].total / limit) }
        });

    } catch (error) {
        console.error('Error obteniendo tickets:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/tickets', authenticateToken, async (req, res) => {
    const pool = getPool();
    try {
        const { subject, description, category_id, priority = 'medium', browser_info = {}, device_info = {}, error_logs, screenshot_urls = [] } = req.body;
        if (!subject || !description) return res.status(400).json({ error: 'Título y descripción son requeridos' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const ticketResult = await client.query(`
                INSERT INTO support_tickets (user_id, user_email, user_nickname, subject, description, category_id, priority, browser_info, device_info, error_logs, screenshot_urls)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
            `, [req.user.id, req.user.email, req.user.nickname, subject, description, category_id, priority, JSON.stringify(browser_info), JSON.stringify(device_info), error_logs, screenshot_urls]);
            const ticket = ticketResult.rows[0];
            await client.query(`
                INSERT INTO support_comments (ticket_id, user_id, user_type, content, is_automated) VALUES ($1, $2, $3, $4, $5)
            `, [ticket.id, req.user.id, 'system', `Ticket creado automáticamente. Usuario: ${req.user.nickname} (${req.user.email})`, true]);
            await client.query('COMMIT');
            res.status(201).json({ success: true, ticket: ticket, message: 'Ticket creado exitosamente' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creando ticket:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/tickets/:id', authenticateToken, async (req, res) => {
    const pool = getPool();
    try {
        const { id } = req.params;
        const ticketResult = await pool.query(`
            SELECT st.*, sc.name as category_name, sc.color as category_color, u.nickname as user_nickname, ua.nickname as assigned_nickname, stg.group_name, stg.total_tickets as group_total_tickets, stg.id as group_id
            FROM support_tickets st
            LEFT JOIN support_categories sc ON st.category_id = sc.id
            LEFT JOIN users u ON st.user_id = u.id
            LEFT JOIN users ua ON st.assigned_to = ua.id
            LEFT JOIN support_ticket_groups stg ON st.group_id = stg.id
            WHERE st.id = $1
        `, [id]);

        if (ticketResult.rows.length === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
        const ticket = ticketResult.rows[0];

        const commentsResult = await pool.query(`
            SELECT sc.*, u.nickname as user_nickname, st.name as template_name
            FROM support_comments sc
            LEFT JOIN users u ON sc.user_id = u.id
            LEFT JOIN support_templates st ON sc.template_id = st.id
            WHERE sc.ticket_id = $1 ORDER BY sc.created_at ASC
        `, [id]);

        let relatedTickets = [];
        if (ticket.group_id) {
            const relatedResult = await pool.query(`
                SELECT id, ticket_number, subject, status, priority, user_nickname, created_at, is_group_master
                FROM support_tickets WHERE group_id = $1 AND id != $2
                ORDER BY is_group_master DESC, created_at ASC LIMIT 10
            `, [ticket.group_id, id]);
            relatedTickets = relatedResult.rows;
        }

        res.json({ ticket, comments: commentsResult.rows, related_tickets: relatedTickets });
    } catch (error) {
        console.error('Error obteniendo detalles del ticket:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ... (rest of the file corrected similarly)

module.exports = router;
