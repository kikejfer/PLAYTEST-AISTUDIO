const express = require('express');
const router = express.Router();
const pool = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// ============================================================================
// CONFIGURACIÓN DE MULTER PARA ADJUNTOS
// ============================================================================

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/messages');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `msg-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: fileFilter
});

// ============================================================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================================================

// Validar que el usuario tiene permiso para ver/participar en una conversación
async function validateConversationAccess(req, res, next) {
    const conversationId = req.params.conversationId || req.body.conversationId;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT * FROM conversations
             WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) AND is_active = true`,
            [conversationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
        }

        req.conversation = result.rows[0];
        next();
    } catch (error) {
        console.error('Error validando acceso a conversación:', error);
        res.status(500).json({ error: 'Error validando acceso' });
    }
}

// Validar permisos de contexto (clase o bloque)
async function validateContextPermissions(req, res, next) {
    const { recipientId, contextType, contextId } = req.body;
    const userId = req.user.id;

    // Si es contexto general, permitir (cualquiera puede chatear con cualquiera)
    if (contextType === 'general') {
        return next();
    }

    try {
        let hasPermission = false;

        if (contextType === 'class' && contextId) {
            // Verificar que el usuario es profesor o alumno de la clase
            const classCheck = await pool.query(
                `SELECT 1 FROM class_students
                 WHERE class_id = $1 AND (student_id = $2 OR student_id = $3)
                 UNION
                 SELECT 1 FROM classes
                 WHERE id = $1 AND teacher_id IN ($2, $3)`,
                [contextId, userId, recipientId]
            );
            hasPermission = classCheck.rows.length > 0;

        } else if (contextType === 'block' && contextId) {
            // Verificar que al menos uno es el creador del bloque o ha jugado el bloque
            const blockCheck = await pool.query(
                `SELECT 1 FROM blocks
                 WHERE id = $1 AND creator_id IN ($2, $3)
                 UNION
                 SELECT 1 FROM game_sessions
                 WHERE block_id = $1 AND user_id IN ($2, $3)`,
                [contextId, userId, recipientId]
            );
            hasPermission = blockCheck.rows.length > 0;
        }

        if (!hasPermission) {
            return res.status(403).json({
                error: 'No tienes permiso para iniciar una conversación en este contexto'
            });
        }

        next();
    } catch (error) {
        console.error('Error validando permisos de contexto:', error);
        res.status(500).json({ error: 'Error validando permisos' });
    }
}

// ============================================================================
// RUTAS: CONVERSACIONES
// ============================================================================

/**
 * GET /api/messages/conversations
 * Obtener lista de conversaciones del usuario actual
 */
router.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { limit = 50, offset = 0, includeArchived = false } = req.query;

    try {
        // Query to get conversations with user details and last message info
        const result = await pool.query(
            `SELECT DISTINCT ON (c.id)
                c.id,
                c.user1_id,
                c.user2_id,
                c.context_type,
                c.context_id,
                c.is_active,
                c.created_at,
                c.updated_at,
                c.is_archived_by_user1,
                c.is_archived_by_user2,
                -- Other user info
                CASE
                    WHEN c.user1_id = $1 THEN u2.id
                    ELSE u1.id
                END as other_user_id,
                CASE
                    WHEN c.user1_id = $1 THEN u2.nickname
                    ELSE u1.nickname
                END as other_user_nickname,
                CASE
                    WHEN c.user1_id = $1 THEN u2.avatar_url
                    ELSE u1.avatar_url
                END as other_user_avatar,
                -- Last message info
                lm.message_text as last_message_text,
                lm.created_at as last_message_time,
                lm.sender_id as last_message_sender_id,
                -- Unread count
                (SELECT COUNT(*) FROM direct_messages
                 WHERE conversation_id = c.id
                 AND recipient_id = $1
                 AND is_read = false
                 AND deleted_at IS NULL) as unread_count
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN LATERAL (
                SELECT message_text, created_at, sender_id
                FROM direct_messages
                WHERE conversation_id = c.id
                AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            WHERE (c.user1_id = $1 OR c.user2_id = $1)
            AND c.is_active = true
            ${includeArchived === 'false' || !includeArchived ? `
            AND NOT (
                (c.user1_id = $1 AND c.is_archived_by_user1 = true)
                OR (c.user2_id = $1 AND c.is_archived_by_user2 = true)
            )` : ''}
            ORDER BY c.id, lm.created_at DESC NULLS LAST
            LIMIT $2 OFFSET $3`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        // Enriquecer con información de contexto
        const conversations = await Promise.all(result.rows.map(async (conv) => {
            let contextInfo = null;

            if (conv.context_type === 'class' && conv.context_id) {
                const classInfo = await pool.query(
                    'SELECT name, description FROM classes WHERE id = $1',
                    [conv.context_id]
                );
                contextInfo = classInfo.rows[0] || null;
            } else if (conv.context_type === 'block' && conv.context_id) {
                const blockInfo = await pool.query(
                    'SELECT name, description FROM blocks WHERE id = $1',
                    [conv.context_id]
                );
                contextInfo = blockInfo.rows[0] || null;
            }

            return {
                ...conv,
                context_info: contextInfo
            };
        }));

        res.json({
            conversations,
            total: conversations.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error obteniendo conversaciones:', error);
        res.status(500).json({ error: 'Error obteniendo conversaciones' });
    }
});

/**
 * POST /api/messages/conversations
 * Crear o obtener conversación con otro usuario
 */
router.post('/conversations', authenticateToken, validateContextPermissions, async (req, res) => {
    const userId = req.user.id;
    const { recipientId, contextType, contextId } = req.body;

    // Validaciones
    if (!recipientId) {
        return res.status(400).json({ error: 'recipientId es requerido' });
    }

    if (!contextType || !['class', 'block', 'general'].includes(contextType)) {
        return res.status(400).json({ error: 'contextType inválido' });
    }

    if (userId === recipientId) {
        return res.status(400).json({ error: 'No puedes crear una conversación contigo mismo' });
    }

    try {
        // Check if conversation already exists (check both orderings)
        const existingConv = await pool.query(
            `SELECT id FROM conversations
             WHERE (
                 (user1_id = $1 AND user2_id = $2)
                 OR (user1_id = $2 AND user2_id = $1)
             )
             AND context_type = $3
             AND (
                 ($4::INTEGER IS NULL AND context_id IS NULL)
                 OR context_id = $4
             )
             AND is_active = true
             LIMIT 1`,
            [userId, recipientId, contextType, contextId || null]
        );

        let conversationId;

        if (existingConv.rows.length > 0) {
            // Conversation already exists
            conversationId = existingConv.rows[0].id;
        } else {
            // Create new conversation (ensure user1_id < user2_id for consistency)
            const [user1Id, user2Id] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];

            const newConv = await pool.query(
                `INSERT INTO conversations (user1_id, user2_id, context_type, context_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [user1Id, user2Id, contextType, contextId || null]
            );
            conversationId = newConv.rows[0].id;
        }

        // Obtener detalles completos de la conversación
        const convDetails = await pool.query(
            `SELECT
                c.*,
                u1.nickname as user1_nickname,
                u1.avatar_url as user1_avatar,
                u2.nickname as user2_nickname,
                u2.avatar_url as user2_avatar
             FROM conversations c
             JOIN users u1 ON c.user1_id = u1.id
             JOIN users u2 ON c.user2_id = u2.id
             WHERE c.id = $1`,
            [conversationId]
        );

        res.status(201).json({
            message: 'Conversación creada/recuperada exitosamente',
            conversation: convDetails.rows[0]
        });

    } catch (error) {
        console.error('Error creando conversación:', error);
        res.status(500).json({ error: 'Error creando conversación' });
    }
});

/**
 * GET /api/messages/conversations/:conversationId
 * Obtener detalles de una conversación específica
 */
router.get('/conversations/:conversationId', authenticateToken, validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT
                c.*,
                u1.id as user1_id, u1.nickname as user1_nickname, u1.avatar_url as user1_avatar,
                u2.id as user2_id, u2.nickname as user2_nickname, u2.avatar_url as user2_avatar,
                cs.is_pinned, cs.is_muted, cs.notifications_enabled
             FROM conversations c
             JOIN users u1 ON c.user1_id = u1.id
             JOIN users u2 ON c.user2_id = u2.id
             LEFT JOIN conversation_settings cs ON cs.conversation_id = c.id AND cs.user_id = $2
             WHERE c.id = $1`,
            [conversationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversación no encontrada' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo conversación:', error);
        res.status(500).json({ error: 'Error obteniendo conversación' });
    }
});

/**
 * PATCH /api/messages/conversations/:conversationId/archive
 * Archivar/desarchivar conversación
 */
router.patch('/conversations/:conversationId/archive', authenticateToken, validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    const { archived } = req.body;

    try {
        const conversation = req.conversation;
        const isUser1 = conversation.user1_id === userId;

        const field = isUser1 ? 'is_archived_by_user1' : 'is_archived_by_user2';

        await pool.query(
            `UPDATE conversations SET ${field} = $1 WHERE id = $2`,
            [archived, conversationId]
        );

        res.json({ message: archived ? 'Conversación archivada' : 'Conversación desarchivada' });

    } catch (error) {
        console.error('Error archivando conversación:', error);
        res.status(500).json({ error: 'Error archivando conversación' });
    }
});

// ============================================================================
// RUTAS: MENSAJES
// ============================================================================

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Obtener mensajes de una conversación (paginados)
 */
router.get('/conversations/:conversationId/messages', authenticateToken, validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const { limit = 50, offset = 0, beforeId } = req.query;

    try {
        let query, params;

        if (beforeId) {
            // Paginación por cursor (mejor para scroll infinito)
            query = `
                SELECT
                    dm.*,
                    u_sender.nickname as sender_nickname,
                    u_sender.avatar_url as sender_avatar,
                    u_recipient.nickname as recipient_nickname,
                    u_recipient.avatar_url as recipient_avatar
                FROM direct_messages dm
                JOIN users u_sender ON dm.sender_id = u_sender.id
                JOIN users u_recipient ON dm.recipient_id = u_recipient.id
                WHERE dm.conversation_id = $1 AND dm.id < $2 AND dm.deleted_at IS NULL
                ORDER BY dm.created_at DESC
                LIMIT $3
            `;
            params = [conversationId, beforeId, parseInt(limit)];
        } else {
            // Paginación por offset
            query = `
                SELECT
                    dm.*,
                    u_sender.nickname as sender_nickname,
                    u_sender.avatar_url as sender_avatar,
                    u_recipient.nickname as recipient_nickname,
                    u_recipient.avatar_url as recipient_avatar
                FROM direct_messages dm
                JOIN users u_sender ON dm.sender_id = u_sender.id
                JOIN users u_recipient ON dm.recipient_id = u_recipient.id
                WHERE dm.conversation_id = $1 AND dm.deleted_at IS NULL
                ORDER BY dm.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [conversationId, parseInt(limit), parseInt(offset)];
        }

        const result = await pool.query(query, params);

        // Obtener adjuntos para cada mensaje
        const messages = await Promise.all(result.rows.map(async (msg) => {
            const attachments = await pool.query(
                `SELECT * FROM message_attachments WHERE direct_message_id = $1`,
                [msg.id]
            );
            return { ...msg, attachments: attachments.rows };
        }));

        // Invertir para que estén en orden cronológico
        messages.reverse();

        res.json({
            messages,
            count: messages.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: 'Error obteniendo mensajes' });
    }
});

/**
 * POST /api/messages/conversations/:conversationId/messages
 * Enviar un mensaje en una conversación
 */
router.post('/conversations/:conversationId/messages',
    authenticateToken,
    validateConversationAccess,
    upload.array('attachments', 5), // Máximo 5 archivos
    async (req, res) => {
        const conversationId = req.params.conversationId;
        const senderId = req.user.id;
        const { messageText } = req.body;
        const files = req.files || [];

        // Validaciones
        if (!messageText || messageText.trim().length === 0) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }

        if (messageText.length > 5000) {
            return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 5000 caracteres)' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Determinar recipientId
            const conversation = req.conversation;
            const recipientId = conversation.user1_id === senderId
                ? conversation.user2_id
                : conversation.user1_id;

            // Insertar mensaje
            const messageResult = await client.query(
                `INSERT INTO direct_messages
                 (conversation_id, sender_id, recipient_id, message_text, message_type)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [conversationId, senderId, recipientId, messageText, 'text']
            );

            const message = messageResult.rows[0];

            // Procesar adjuntos si existen
            const attachments = [];
            for (const file of files) {
                const attachmentResult = await client.query(
                    `INSERT INTO message_attachments
                     (direct_message_id, filename, original_name, file_type, file_size, file_path, uploaded_by, is_image)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING *`,
                    [
                        message.id,
                        file.filename,
                        file.originalname,
                        file.mimetype,
                        file.size,
                        `/uploads/messages/${file.filename}`,
                        senderId,
                        file.mimetype.startsWith('image/')
                    ]
                );
                attachments.push(attachmentResult.rows[0]);
            }

            await client.query('COMMIT');

            // Obtener mensaje completo con información de usuarios
            const completeMessage = await pool.query(
                `SELECT
                    dm.*,
                    u_sender.nickname as sender_nickname,
                    u_sender.avatar_url as sender_avatar,
                    u_recipient.nickname as recipient_nickname,
                    u_recipient.avatar_url as recipient_avatar
                FROM direct_messages dm
                JOIN users u_sender ON dm.sender_id = u_sender.id
                JOIN users u_recipient ON dm.recipient_id = u_recipient.id
                WHERE dm.id = $1`,
                [message.id]
            );

            // Emitir evento WebSocket en tiempo real
            const messagingHandler = req.app.get('messagingHandler');
            if (messagingHandler) {
                messagingHandler.sendMessageToConversation(conversationId, {
                    ...completeMessage.rows[0],
                    attachments
                });
            }

            res.status(201).json({
                message: 'Mensaje enviado exitosamente',
                data: {
                    ...completeMessage.rows[0],
                    attachments
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error enviando mensaje:', error);

            // Limpiar archivos subidos en caso de error
            for (const file of files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Error eliminando archivo:', unlinkError);
                }
            }

            res.status(500).json({ error: 'Error enviando mensaje' });
        } finally {
            client.release();
        }
    }
);

/**
 * PATCH /api/messages/:messageId/read
 * Marcar un mensaje como leído
 */
router.patch('/:messageId/read', authenticateToken, async (req, res) => {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    try {
        // Update message as read only if the current user is the recipient
        const result = await pool.query(
            `UPDATE direct_messages
             SET is_read = true, read_at = NOW()
             WHERE id = $1 AND recipient_id = $2 AND is_read = false
             RETURNING id`,
            [messageId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para marcar este mensaje o ya está marcado' });
        }

        res.json({ message: 'Mensaje marcado como leído' });

    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({ error: 'Error marcando mensaje' });
    }
});

/**
 * PATCH /api/messages/conversations/:conversationId/read-all
 * Marcar todos los mensajes de una conversación como leídos
 */
router.patch('/conversations/:conversationId/read-all', authenticateToken, validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    try {
        // Mark all unread messages in this conversation as read
        const result = await pool.query(
            `UPDATE direct_messages
             SET is_read = true, read_at = NOW()
             WHERE conversation_id = $1
             AND recipient_id = $2
             AND is_read = false
             AND deleted_at IS NULL
             RETURNING id`,
            [conversationId, userId]
        );

        res.json({
            message: `${result.rows.length} mensajes marcados como leídos`,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error marcando conversación como leída:', error);
        res.status(500).json({ error: 'Error marcando conversación' });
    }
});

// ============================================================================
// RUTAS: CONFIGURACIÓN DE CONVERSACIONES
// ============================================================================

/**
 * PATCH /api/messages/conversations/:conversationId/settings
 * Actualizar configuración de una conversación
 */
router.patch('/conversations/:conversationId/settings', authenticateToken, validateConversationAccess, async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    const { isPinned, isMuted, notificationsEnabled, soundEnabled, desktopNotifications } = req.body;

    try {
        // Crear o actualizar configuración
        const result = await pool.query(
            `INSERT INTO conversation_settings
             (conversation_id, user_id, is_pinned, is_muted, notifications_enabled, sound_enabled, desktop_notifications)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (conversation_id, user_id)
             DO UPDATE SET
                is_pinned = COALESCE($3, conversation_settings.is_pinned),
                is_muted = COALESCE($4, conversation_settings.is_muted),
                notifications_enabled = COALESCE($5, conversation_settings.notifications_enabled),
                sound_enabled = COALESCE($6, conversation_settings.sound_enabled),
                desktop_notifications = COALESCE($7, conversation_settings.desktop_notifications),
                updated_at = NOW()
             RETURNING *`,
            [conversationId, userId, isPinned, isMuted, notificationsEnabled, soundEnabled, desktopNotifications]
        );

        res.json({
            message: 'Configuración actualizada',
            settings: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({ error: 'Error actualizando configuración' });
    }
});

// ============================================================================
// RUTAS: ADJUNTOS
// ============================================================================

/**
 * GET /api/messages/attachments/:filename
 * Descargar un adjunto
 */
router.get('/attachments/:filename', authenticateToken, async (req, res) => {
    const filename = req.params.filename;
    const userId = req.user.id;

    try {
        // Verificar que el usuario tiene acceso al adjunto
        const result = await pool.query(
            `SELECT ma.*, dm.conversation_id
             FROM message_attachments ma
             JOIN direct_messages dm ON ma.direct_message_id = dm.id
             JOIN conversations c ON dm.conversation_id = c.id
             WHERE ma.filename = $1
             AND (c.user1_id = $2 OR c.user2_id = $2)`,
            [filename, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Archivo no encontrado o sin acceso' });
        }

        const attachment = result.rows[0];
        const filePath = path.join(__dirname, '../uploads/messages', filename);

        res.download(filePath, attachment.original_name);

    } catch (error) {
        console.error('Error descargando adjunto:', error);
        res.status(500).json({ error: 'Error descargando archivo' });
    }
});

// ============================================================================
// RUTAS: ESTADÍSTICAS Y UTILIDADES
// ============================================================================

/**
 * GET /api/messages/unread-count
 * Obtener cantidad total de mensajes no leídos
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT
                COUNT(*) as total_unread,
                COUNT(DISTINCT conversation_id) as conversations_with_unread
             FROM direct_messages
             WHERE recipient_id = $1 AND is_read = false AND deleted_at IS NULL`,
            [userId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo conteo de no leídos:', error);
        res.status(500).json({ error: 'Error obteniendo conteo' });
    }
});

/**
 * GET /api/messages/search
 * Buscar mensajes
 */
router.get('/search', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { query, conversationId, limit = 20, offset = 0 } = req.query;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    try {
        let sqlQuery, params;

        if (conversationId) {
            sqlQuery = `
                SELECT dm.*,
                    u_sender.nickname as sender_nickname,
                    u_recipient.nickname as recipient_nickname
                FROM direct_messages dm
                JOIN users u_sender ON dm.sender_id = u_sender.id
                JOIN users u_recipient ON dm.recipient_id = u_recipient.id
                WHERE dm.conversation_id = $1
                AND (dm.sender_id = $2 OR dm.recipient_id = $2)
                AND dm.message_text ILIKE $3
                AND dm.deleted_at IS NULL
                ORDER BY dm.created_at DESC
                LIMIT $4 OFFSET $5
            `;
            params = [conversationId, userId, `%${query}%`, parseInt(limit), parseInt(offset)];
        } else {
            sqlQuery = `
                SELECT dm.*,
                    u_sender.nickname as sender_nickname,
                    u_recipient.nickname as recipient_nickname,
                    c.context_type
                FROM direct_messages dm
                JOIN conversations c ON dm.conversation_id = c.id
                JOIN users u_sender ON dm.sender_id = u_sender.id
                JOIN users u_recipient ON dm.recipient_id = u_recipient.id
                WHERE (c.user1_id = $1 OR c.user2_id = $1)
                AND dm.message_text ILIKE $2
                AND dm.deleted_at IS NULL
                ORDER BY dm.created_at DESC
                LIMIT $3 OFFSET $4
            `;
            params = [userId, `%${query}%`, parseInt(limit), parseInt(offset)];
        }

        const result = await pool.query(sqlQuery, params);

        res.json({
            results: result.rows,
            count: result.rows.length,
            query,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error buscando mensajes:', error);
        res.status(500).json({ error: 'Error en la búsqueda' });
    }
});

module.exports = router;
