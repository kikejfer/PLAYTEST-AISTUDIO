const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

/**
 * Clase para manejar eventos de WebSocket relacionados con mensajería directa
 */
class MessagingWebSocketHandler {
    constructor(io) {
        this.io = io;
        this.userSockets = new Map(); // userId -> Set of socketIds
        this.socketUsers = new Map(); // socketId -> userId
    }

    /**
     * Inicializar manejadores de eventos
     */
    initialize() {
        // Middleware de autenticación para Socket.IO
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                console.log('🔐 WebSocket auth attempt - Token present:', !!token);

                if (!token) {
                    console.error('🔒 WebSocket auth failed: No token provided');
                    return next(new Error('Authentication error: No token provided'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('✅ JWT verified, userId:', decoded.userId);

                // Verificar que el usuario existe
                const result = await pool.query(
                    'SELECT id, nickname, avatar_url FROM users WHERE id = $1',
                    [decoded.userId]
                );

                if (result.rows.length === 0) {
                    console.error('🔒 WebSocket auth failed: User not found in database, userId:', decoded.userId);
                    return next(new Error('Authentication error: User not found'));
                }

                socket.userId = decoded.userId;
                socket.userNickname = result.rows[0].nickname;
                socket.userAvatar = result.rows[0].avatar_url;

                console.log(`🔐 Socket authenticated for user: ${socket.userNickname} (${socket.userId})`);
                next();

            } catch (error) {
                console.error('🔒 Socket authentication failed:', error);
                if (error.name === 'JsonWebTokenError') {
                    return next(new Error('Authentication error: Invalid token'));
                } else if (error.name === 'TokenExpiredError') {
                    return next(new Error('Authentication error: Token expired'));
                }
                next(new Error('Authentication error: ' + error.message));
            }
        });

        // Manejadores de conexión
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        console.log('✅ WebSocket Messaging Handler initialized');
    }

    /**
     * Manejar nueva conexión de socket
     */
    async handleConnection(socket) {
        const userId = socket.userId;

        console.log(`🟢 User connected: ${socket.userNickname} (socket: ${socket.id})`);

        // Registrar socket del usuario
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        this.socketUsers.set(socket.id, userId);

        // Actualizar estado online en base de datos
        await this.updateUserOnlineStatus(userId, true, socket.id);

        // Unirse a conversaciones del usuario
        await this.joinUserConversations(socket, userId);

        // Emitir lista de usuarios online a sus contactos
        await this.broadcastUserOnlineStatus(userId, true);

        // Manejadores de eventos
        this.setupEventHandlers(socket);

        // Manejar desconexión
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }

    /**
     * Configurar manejadores de eventos del socket
     */
    setupEventHandlers(socket) {
        const userId = socket.userId;

        // Evento: Unirse a una conversación específica
        socket.on('join_conversation', (conversationId) => {
            this.handleJoinConversation(socket, conversationId);
        });

        // Evento: Salir de una conversación
        socket.on('leave_conversation', (conversationId) => {
            this.handleLeaveConversation(socket, conversationId);
        });

        // Evento: Usuario está escribiendo
        socket.on('typing_start', (data) => {
            this.handleTypingStart(socket, data);
        });

        // Evento: Usuario dejó de escribir
        socket.on('typing_stop', (data) => {
            this.handleTypingStop(socket, data);
        });

        // Evento: Marcar mensaje como leído
        socket.on('mark_read', (data) => {
            this.handleMarkRead(socket, data);
        });

        // Evento: Marcar conversación completa como leída
        socket.on('mark_conversation_read', (data) => {
            this.handleMarkConversationRead(socket, data);
        });

        // Evento: Solicitar estado online de un usuario
        socket.on('request_user_status', (targetUserId) => {
            this.handleRequestUserStatus(socket, targetUserId);
        });
    }

    /**
     * Unir usuario a todas sus conversaciones activas
     */
    async joinUserConversations(socket, userId) {
        try {
            const result = await pool.query(
                `SELECT id FROM conversations
                 WHERE (user1_id = $1 OR user2_id = $1) AND is_active = true`,
                [userId]
            );

            for (const row of result.rows) {
                const roomName = `conversation_${row.id}`;
                socket.join(roomName);
                console.log(`📥 User ${socket.userNickname} joined room: ${roomName}`);
            }

        } catch (error) {
            console.error('Error joining user conversations:', error);
        }
    }

    /**
     * Manejar unión a conversación específica
     */
    async handleJoinConversation(socket, conversationId) {
        const userId = socket.userId;

        try {
            // Verificar que el usuario tiene acceso a la conversación
            const result = await pool.query(
                `SELECT * FROM conversations
                 WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
                [conversationId, userId]
            );

            if (result.rows.length === 0) {
                socket.emit('error', { message: 'No tienes acceso a esta conversación' });
                return;
            }

            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);

            console.log(`📥 User ${socket.userNickname} joined conversation: ${conversationId}`);

            // Notificar al otro usuario que este usuario se unió
            socket.to(roomName).emit('user_joined_conversation', {
                conversationId,
                userId,
                nickname: socket.userNickname
            });

        } catch (error) {
            console.error('Error joining conversation:', error);
            socket.emit('error', { message: 'Error al unirse a la conversación' });
        }
    }

    /**
     * Manejar salida de conversación
     */
    handleLeaveConversation(socket, conversationId) {
        const roomName = `conversation_${conversationId}`;
        socket.leave(roomName);

        console.log(`📤 User ${socket.userNickname} left conversation: ${conversationId}`);

        // Notificar al otro usuario
        socket.to(roomName).emit('user_left_conversation', {
            conversationId,
            userId: socket.userId,
            nickname: socket.userNickname
        });
    }

    /**
     * Manejar inicio de escritura
     */
    async handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        try {
            // Guardar en base de datos con expiración automática
            await pool.query(
                `INSERT INTO typing_status (conversation_id, user_id, is_typing, expires_at)
                 VALUES ($1, $2, true, NOW() + INTERVAL '5 seconds')
                 ON CONFLICT (conversation_id, user_id)
                 DO UPDATE SET
                    is_typing = true,
                    started_at = NOW(),
                    expires_at = NOW() + INTERVAL '5 seconds'`,
                [conversationId, userId]
            );

            // Emitir a otros usuarios en la conversación
            socket.to(`conversation_${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                nickname: socket.userNickname,
                isTyping: true
            });

            console.log(`⌨️ User ${socket.userNickname} is typing in conversation ${conversationId}`);

        } catch (error) {
            console.error('Error handling typing start:', error);
        }
    }

    /**
     * Manejar fin de escritura
     */
    async handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        try {
            // Eliminar de base de datos
            await pool.query(
                'DELETE FROM typing_status WHERE conversation_id = $1 AND user_id = $2',
                [conversationId, userId]
            );

            // Emitir a otros usuarios
            socket.to(`conversation_${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                nickname: socket.userNickname,
                isTyping: false
            });

            console.log(`⌨️ User ${socket.userNickname} stopped typing in conversation ${conversationId}`);

        } catch (error) {
            console.error('Error handling typing stop:', error);
        }
    }

    /**
     * Manejar marcado de mensaje como leído
     */
    async handleMarkRead(socket, data) {
        const { messageId, conversationId } = data;
        const userId = socket.userId;

        try {
            const result = await pool.query(
                'SELECT mark_message_as_read($1, $2) as success',
                [messageId, userId]
            );

            if (result.rows[0].success) {
                // Notificar al remitente que el mensaje fue leído
                socket.to(`conversation_${conversationId}`).emit('message_read', {
                    messageId,
                    conversationId,
                    readBy: userId,
                    readAt: new Date()
                });
            }

        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    /**
     * Manejar marcado de conversación completa como leída
     */
    async handleMarkConversationRead(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        try {
            const result = await pool.query(
                'SELECT mark_conversation_as_read($1, $2) as count',
                [conversationId, userId]
            );

            // Notificar al otro usuario
            socket.to(`conversation_${conversationId}`).emit('conversation_read', {
                conversationId,
                readBy: userId,
                messageCount: result.rows[0].count,
                readAt: new Date()
            });

        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    /**
     * Manejar solicitud de estado online de usuario
     */
    handleRequestUserStatus(socket, targetUserId) {
        const isOnline = this.userSockets.has(targetUserId);

        socket.emit('user_status_response', {
            userId: targetUserId,
            isOnline,
            timestamp: new Date()
        });
    }

    /**
     * Manejar desconexión
     */
    async handleDisconnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;

        console.log(`🔴 User disconnected: ${socket.userNickname} (socket: ${socketId})`);

        // Remover socket de los registros
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socketId);

            // Si no quedan más sockets, marcar como offline
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
                await this.updateUserOnlineStatus(userId, false);
                await this.broadcastUserOnlineStatus(userId, false);
            }
        }

        this.socketUsers.delete(socketId);

        // Limpiar estados de typing
        await this.cleanupTypingStatus(userId);
    }

    /**
     * Actualizar estado online del usuario en base de datos
     */
    async updateUserOnlineStatus(userId, isOnline, socketId = null) {
        try {
            if (isOnline) {
                await pool.query(
                    `INSERT INTO user_online_status (user_id, is_online, socket_id, connected_at, updated_at)
                     VALUES ($1, true, $2, NOW(), NOW())
                     ON CONFLICT (user_id)
                     DO UPDATE SET
                        is_online = true,
                        socket_id = $2,
                        connected_at = NOW(),
                        updated_at = NOW()`,
                    [userId, socketId]
                );
            } else {
                await pool.query(
                    `UPDATE user_online_status
                     SET is_online = false, last_seen = NOW(), updated_at = NOW(), socket_id = NULL
                     WHERE user_id = $1`,
                    [userId]
                );
            }
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }

    /**
     * Broadcast estado online a contactos del usuario
     */
    async broadcastUserOnlineStatus(userId, isOnline) {
        try {
            // Obtener todas las conversaciones del usuario
            const result = await pool.query(
                `SELECT id, user1_id, user2_id FROM conversations
                 WHERE (user1_id = $1 OR user2_id = $1) AND is_active = true`,
                [userId]
            );

            // Para cada conversación, notificar al otro usuario
            for (const conv of result.rows) {
                const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

                // Si el otro usuario está online, enviarle el estado
                if (this.userSockets.has(otherUserId)) {
                    const otherUserSockets = this.userSockets.get(otherUserId);
                    otherUserSockets.forEach(socketId => {
                        this.io.to(socketId).emit('user_status_change', {
                            userId,
                            isOnline,
                            timestamp: new Date()
                        });
                    });
                }
            }

        } catch (error) {
            console.error('Error broadcasting online status:', error);
        }
    }

    /**
     * Limpiar estados de typing del usuario
     */
    async cleanupTypingStatus(userId) {
        try {
            await pool.query(
                'DELETE FROM typing_status WHERE user_id = $1',
                [userId]
            );
        } catch (error) {
            console.error('Error cleaning up typing status:', error);
        }
    }

    /**
     * Enviar mensaje en tiempo real (llamado desde las rutas API)
     */
    sendMessageToConversation(conversationId, message) {
        this.io.to(`conversation_${conversationId}`).emit('new_message', message);
        console.log(`📨 Message sent to conversation ${conversationId}`);
    }

    /**
     * Obtener usuarios online
     */
    getOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }

    /**
     * Verificar si un usuario está online
     */
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }

    /**
     * Obtener conteo de conexiones
     */
    getConnectionStats() {
        return {
            totalConnections: this.socketUsers.size,
            uniqueUsers: this.userSockets.size,
            timestamp: new Date()
        };
    }
}

// Función helper para limpiar estados de typing expirados (cron job)
async function cleanupExpiredTypingStatus() {
    try {
        const result = await pool.query('SELECT cleanup_expired_typing_status() as count');
        const count = result.rows[0].count;
        if (count > 0) {
            console.log(`🧹 Cleaned up ${count} expired typing statuses`);
        }
        return count;
    } catch (error) {
        console.error('Error cleaning up expired typing status:', error);
        return 0;
    }
}

module.exports = {
    MessagingWebSocketHandler,
    cleanupExpiredTypingStatus
};
