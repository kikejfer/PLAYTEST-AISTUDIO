const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const pushService = require('../services/push-notifications');

// =====================================================
// ENDPOINTS DE NOTIFICACIONES PUSH
// =====================================================

// Registrar token de dispositivo
router.post('/register-device', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { playerId, platform = 'web' } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: 'playerId es requerido' });
        }

        const success = await pushService.registerDeviceToken(userId, playerId, platform);

        if (success) {
            res.json({
                success: true,
                message: 'Dispositivo registrado para notificaciones'
            });
        } else {
            res.status(500).json({ error: 'Error al registrar dispositivo' });
        }
    } catch (error) {
        console.error('Error in /register-device:', error);
        res.status(500).json({ error: 'Error al registrar dispositivo' });
    }
});

// Desregistrar token de dispositivo
router.post('/unregister-device', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { playerId } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: 'playerId es requerido' });
        }

        const success = await pushService.unregisterDeviceToken(userId, playerId);

        if (success) {
            res.json({
                success: true,
                message: 'Dispositivo desregistrado'
            });
        } else {
            res.status(500).json({ error: 'Error al desregistrar dispositivo' });
        }
    } catch (error) {
        console.error('Error in /unregister-device:', error);
        res.status(500).json({ error: 'Error al desregistrar dispositivo' });
    }
});

// Obtener dispositivos registrados del usuario
router.get('/my-devices', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(`
            SELECT id, platform, is_active, created_at, updated_at
            FROM user_push_tokens
            WHERE user_id = $1
            ORDER BY updated_at DESC
        `, [userId]);

        res.json({
            success: true,
            devices: result.rows
        });
    } catch (error) {
        console.error('Error in /my-devices:', error);
        res.status(500).json({ error: 'Error al obtener dispositivos' });
    }
});

// Enviar notificación de prueba
router.post('/test-notification', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pushService.sendToUser(userId, {
            title: '🎉 Notificación de prueba',
            body: 'Las notificaciones push funcionan correctamente',
            data: {
                type: 'test',
                timestamp: Date.now()
            }
        });

        res.json({
            success: result.success,
            message: result.success
                ? 'Notificación enviada'
                : `Error: ${result.reason || result.error}`
        });
    } catch (error) {
        console.error('Error in /test-notification:', error);
        res.status(500).json({ error: 'Error al enviar notificación de prueba' });
    }
});

// Obtener historial de notificaciones recibidas
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(`
            SELECT
                id,
                title,
                body,
                data,
                sent_at
            FROM push_notifications_log
            WHERE user_id = $1
            AND success = TRUE
            ORDER BY sent_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        res.json({
            success: true,
            notifications: result.rows,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error in /history:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

// =====================================================
// ENDPOINTS ADMINISTRATIVOS
// =====================================================

// Enviar notificación a usuario específico (admin)
router.post('/send-to-user/:userId', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const targetUserId = parseInt(req.params.userId);
        const { title, body, data, url } = req.body;

        const result = await pushService.sendToUser(targetUserId, {
            title,
            body,
            data,
            url
        });

        res.json(result);
    } catch (error) {
        console.error('Error in /send-to-user:', error);
        res.status(500).json({ error: 'Error al enviar notificación' });
    }
});

// Enviar notificación masiva (admin)
router.post('/broadcast', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { title, body, data, url, userIds } = req.body;

        let targetUserIds;

        if (userIds && Array.isArray(userIds)) {
            targetUserIds = userIds;
        } else {
            // Enviar a todos los usuarios activos
            const result = await pool.query(`
                SELECT DISTINCT user_id
                FROM user_push_tokens
                WHERE is_active = TRUE
            `);
            targetUserIds = result.rows.map(r => r.user_id);
        }

        const results = await pushService.sendToMultipleUsers(targetUserIds, {
            title,
            body,
            data,
            url
        });

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Error in /broadcast:', error);
        res.status(500).json({ error: 'Error al enviar notificaciones masivas' });
    }
});

// Estadísticas de notificaciones (admin)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Verificar que es admin
        if (!req.user.roles || !req.user.roles.includes('ADP')) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const result = await pool.query(`
            SELECT
                COUNT(DISTINCT user_id) as users_with_devices,
                COUNT(*) as total_devices,
                COUNT(*) FILTER (WHERE is_active) as active_devices,
                COUNT(*) FILTER (WHERE platform = 'web') as web_devices,
                COUNT(*) FILTER (WHERE platform = 'ios') as ios_devices,
                COUNT(*) FILTER (WHERE platform = 'android') as android_devices
            FROM user_push_tokens
        `);

        const logResult = await pool.query(`
            SELECT
                COUNT(*) as total_sent,
                COUNT(*) FILTER (WHERE success) as successful,
                COUNT(*) FILTER (WHERE NOT success) as failed,
                COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '24 hours') as sent_last_24h,
                COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '7 days') as sent_last_week
            FROM push_notifications_log
        `);

        res.json({
            success: true,
            devices: result.rows[0],
            notifications: logResult.rows[0]
        });
    } catch (error) {
        console.error('Error in /stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
