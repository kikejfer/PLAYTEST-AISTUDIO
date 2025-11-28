import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

/**
 * Servicio para manejar comunicaciones de chat directo
 */
class ChatService {
    constructor() {
        this.socket = null;
        this.token = null;
        this.listeners = new Map();
        this.isConnected = false;
    }

    /**
     * Inicializar conexión WebSocket
     */
    connect(token) {
        if (this.socket?.connected) {
            console.log('WebSocket ya está conectado');
            return;
        }

        this.token = token;

        this.socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.setupEventListeners();
    }

    /**
     * Configurar event listeners del socket
     */
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ WebSocket conectado');
            this.isConnected = true;
            this.emit('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket desconectado:', reason);
            this.isConnected = false;
            this.emit('disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Error de conexión WebSocket:', error);
            this.emit('error', error);
        });

        // Eventos de mensajería
        this.socket.on('new_message', (message) => {
            this.emit('new_message', message);
        });

        this.socket.on('user_typing', (data) => {
            this.emit('user_typing', data);
        });

        this.socket.on('message_read', (data) => {
            this.emit('message_read', data);
        });

        this.socket.on('conversation_read', (data) => {
            this.emit('conversation_read', data);
        });

        this.socket.on('user_status_change', (data) => {
            this.emit('user_status_change', data);
        });

        this.socket.on('user_joined_conversation', (data) => {
            this.emit('user_joined_conversation', data);
        });

        this.socket.on('user_left_conversation', (data) => {
            this.emit('user_left_conversation', data);
        });

        this.socket.on('user_status_response', (data) => {
            this.emit('user_status_response', data);
        });
    }

    /**
     * Desconectar WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Unirse a una conversación
     */
    joinConversation(conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('join_conversation', conversationId);
        }
    }

    /**
     * Salir de una conversación
     */
    leaveConversation(conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('leave_conversation', conversationId);
        }
    }

    /**
     * Indicar que el usuario está escribiendo
     */
    startTyping(conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('typing_start', { conversationId });
        }
    }

    /**
     * Indicar que el usuario dejó de escribir
     */
    stopTyping(conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('typing_stop', { conversationId });
        }
    }

    /**
     * Marcar mensaje como leído
     */
    markMessageAsRead(messageId, conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('mark_read', { messageId, conversationId });
        }
    }

    /**
     * Marcar conversación completa como leída
     */
    markConversationAsRead(conversationId) {
        if (this.socket?.connected) {
            this.socket.emit('mark_conversation_read', { conversationId });
        }
    }

    /**
     * Solicitar estado de un usuario
     */
    requestUserStatus(userId) {
        if (this.socket?.connected) {
            this.socket.emit('request_user_status', userId);
        }
    }

    // ========================================================================
    // API REST METHODS
    // ========================================================================

    /**
     * Realizar petición HTTP con autenticación
     */
    async fetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Obtener lista de conversaciones
     */
    async getConversations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.fetch(`/messages/conversations?${queryString}`);
    }

    /**
     * Crear o obtener conversación
     */
    async createConversation(recipientId, contextType, contextId = null) {
        return this.fetch('/messages/conversations', {
            method: 'POST',
            body: JSON.stringify({ recipientId, contextType, contextId })
        });
    }

    /**
     * Obtener detalles de conversación
     */
    async getConversation(conversationId) {
        return this.fetch(`/messages/conversations/${conversationId}`);
    }

    /**
     * Obtener mensajes de una conversación
     */
    async getMessages(conversationId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.fetch(`/messages/conversations/${conversationId}/messages?${queryString}`);
    }

    /**
     * Enviar mensaje
     */
    async sendMessage(conversationId, messageText, attachments = []) {
        const formData = new FormData();
        formData.append('messageText', messageText);

        attachments.forEach((file) => {
            formData.append('attachments', file);
        });

        const response = await fetch(
            `${API_BASE_URL}/messages/conversations/${conversationId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Marcar mensaje como leído (via API)
     */
    async markMessageAsReadAPI(messageId) {
        return this.fetch(`/messages/${messageId}/read`, {
            method: 'PATCH'
        });
    }

    /**
     * Marcar conversación como leída (via API)
     */
    async markConversationAsReadAPI(conversationId) {
        return this.fetch(`/messages/conversations/${conversationId}/read-all`, {
            method: 'PATCH'
        });
    }

    /**
     * Archivar/desarchivar conversación
     */
    async archiveConversation(conversationId, archived = true) {
        return this.fetch(`/messages/conversations/${conversationId}/archive`, {
            method: 'PATCH',
            body: JSON.stringify({ archived })
        });
    }

    /**
     * Actualizar configuración de conversación
     */
    async updateConversationSettings(conversationId, settings) {
        return this.fetch(`/messages/conversations/${conversationId}/settings`, {
            method: 'PATCH',
            body: JSON.stringify(settings)
        });
    }

    /**
     * Obtener conteo de mensajes no leídos
     */
    async getUnreadCount() {
        return this.fetch('/messages/unread-count');
    }

    /**
     * Buscar mensajes
     */
    async searchMessages(query, params = {}) {
        const queryString = new URLSearchParams({ query, ...params }).toString();
        return this.fetch(`/messages/search?${queryString}`);
    }

    /**
     * Descargar adjunto
     */
    getAttachmentUrl(filename) {
        return `${API_BASE_URL}/messages/attachments/${filename}`;
    }

    // ========================================================================
    // EVENT EMITTER PATTERN
    // ========================================================================

    /**
     * Suscribirse a un evento
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Retornar función para desuscribirse
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Desuscribirse de un evento
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emitir evento a listeners
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Limpiar todos los listeners
     */
    removeAllListeners() {
        this.listeners.clear();
    }
}

// Exportar instancia singleton
export const chatService = new ChatService();
export default chatService;
