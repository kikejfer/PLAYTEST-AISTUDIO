/**
 * Cliente de Mensajería Directa con WebSocket
 * Maneja la conexión WebSocket, carga de conversaciones, envío/recepción de mensajes
 */

class DirectMessagingClient {
    constructor() {
        this.apiService = new APIDataService();
        this.baseURL = this.apiService.baseURL.replace('/api', '');
        this.socket = null;
        this.currentConversation = null;
        this.conversations = [];
        this.currentUserId = null;
        this.typingTimeouts = new Map();
        this.messageCache = new Map();
    }

    /**
     * Inicializar el cliente
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Direct Messaging Client...');

            // Obtener usuario actual
            const userData = await this.apiService.getCurrentUser();
            this.currentUserId = userData.id;
            console.log('👤 Current user ID:', this.currentUserId);

            // Conectar WebSocket
            await this.connectWebSocket();

            // Cargar conversaciones
            await this.loadConversations();

            // Configurar event listeners
            this.setupEventListeners();

            // Iniciar polling de contador de no leídos
            this.startUnreadCountPolling();

            console.log('✅ Direct Messaging Client initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing messaging client:', error);
            this.showError('Error al inicializar el sistema de mensajería');
        }
    }

    /**
     * Conectar al servidor WebSocket
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');

            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }

            console.log('🔌 Connecting to WebSocket server:', this.baseURL);

            this.socket = io(this.baseURL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected:', this.socket.id);
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔴 WebSocket disconnected:', reason);
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
                this.loadConversations(); // Recargar conversaciones al reconectar
            });

            // Eventos de mensajería
            this.setupWebSocketEvents();

            // Timeout de conexión
            setTimeout(() => {
                if (!this.socket.connected) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Configurar eventos de WebSocket
     */
    setupWebSocketEvents() {
        // Nuevo mensaje recibido
        this.socket.on('new_message', (message) => {
            console.log('📨 New message received:', message);
            this.handleNewMessage(message);
        });

        // Usuario escribiendo
        this.socket.on('user_typing', (data) => {
            console.log('⌨️ User typing:', data);
            this.handleTypingIndicator(data);
        });

        // Mensaje leído
        this.socket.on('message_read', (data) => {
            console.log('✅ Message read:', data);
            this.handleMessageRead(data);
        });

        // Estado online/offline de usuario
        this.socket.on('user_status_change', (data) => {
            console.log('🟢 User status change:', data);
            this.handleUserStatusChange(data);
        });

        // Conversación marcada como leída
        this.socket.on('conversation_read', (data) => {
            console.log('✅ Conversation read:', data);
            this.handleConversationRead(data);
        });

        // Errores
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.showError(error.message || 'Error de comunicación');
        });
    }

    /**
     * Cargar lista de conversaciones
     */
    async loadConversations(searchQuery = '') {
        try {
            console.log('📋 Loading conversations...');
            const data = await this.apiService.apiCall('/messages/conversations?limit=100');
            this.conversations = data.conversations || [];

            console.log('✅ Loaded', this.conversations.length, 'conversations');

            // Filtrar si hay búsqueda
            let filteredConversations = this.conversations;
            if (searchQuery) {
                filteredConversations = this.conversations.filter(conv => {
                    const otherUserName = this.getOtherUserName(conv).toLowerCase();
                    return otherUserName.includes(searchQuery.toLowerCase());
                });
            }

            this.renderConversationsList(filteredConversations);
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            this.showError('Error al cargar conversaciones');
        }
    }

    /**
     * Renderizar lista de conversaciones
     */
    renderConversationsList(conversations) {
        const listContainer = document.getElementById('conversations-list');

        if (conversations.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <p style="text-align: center; color: #778DA9;">
                        No hay conversaciones aún.<br>
                        Inicia una nueva conversación desde un perfil de usuario.
                    </p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = conversations.map(conv => {
            const otherUserName = this.getOtherUserName(conv);
            const otherUserInitial = otherUserName.charAt(0).toUpperCase();
            const isActive = this.currentConversation && this.currentConversation.id === conv.id;
            const unreadCount = conv.unread_count || 0;
            const lastMessageTime = this.formatTime(conv.last_message_at);
            const lastMessagePreview = conv.last_message_text || 'Sin mensajes';

            return `
                <div class="conversation-item ${isActive ? 'active' : ''}"
                     data-conversation-id="${conv.id}"
                     onclick="messagingClient.selectConversation('${conv.id}')">
                    <div class="conversation-avatar">
                        ${otherUserInitial}
                        ${conv.other_user_is_online ? '<div class="online-indicator"></div>' : ''}
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <div class="conversation-name">${this.escapeHtml(otherUserName)}</div>
                            <div class="conversation-time">${lastMessageTime}</div>
                        </div>
                        <div class="conversation-preview">
                            ${this.escapeHtml(lastMessagePreview)}
                        </div>
                    </div>
                    ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Seleccionar una conversación
     */
    async selectConversation(conversationId) {
        try {
            // Convert to number to ensure proper comparison
            const convId = typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId;
            console.log('🔍 Selecting conversation:', convId);

            // Buscar conversación en la lista
            const conversation = this.conversations.find(c => c.id === convId);
            if (!conversation) {
                console.error('❌ Conversation not found. Available conversations:', this.conversations.map(c => c.id));
                throw new Error('Conversation not found');
            }

            this.currentConversation = conversation;

            // Cargar detalles completos de la conversación
            const convDetails = await this.apiService.apiCall(`/messages/conversations/${convId}`);

            // Unirse a la sala de WebSocket
            this.socket.emit('join_conversation', convId);

            // Cargar mensajes
            await this.loadMessages(convId);

            // Marcar como leída
            await this.markConversationAsRead(convId);

            // Renderizar UI del chat
            this.renderChatArea(convDetails);

            // Actualizar lista de conversaciones
            this.renderConversationsList(this.conversations);
        } catch (error) {
            console.error('❌ Error selecting conversation:', error);

            // Provide more specific error messages
            if (error.message === 'Conversation not found') {
                this.showError('La conversación no existe o ha sido eliminada. Recarga la página para actualizar la lista.');
            } else if (error.status === 403) {
                this.showError('No tienes permiso para acceder a esta conversación.');
            } else if (error.status === 404) {
                this.showError('Conversación no encontrada en el servidor. Recarga la página.');
            } else {
                this.showError('Error al abrir la conversación. Verifica tu conexión e intenta nuevamente.');
            }

            // Reload conversations to sync with server
            await this.loadConversations();
        }
    }

    /**
     * Cargar mensajes de una conversación
     */
    async loadMessages(conversationId, beforeId = null) {
        try {
            const params = new URLSearchParams({ limit: 50 });
            if (beforeId) params.append('beforeId', beforeId);

            const data = await this.apiService.apiCall(
                `/messages/conversations/${conversationId}/messages?${params}`
            );
            const messages = data.messages || [];

            console.log('✅ Loaded', messages.length, 'messages');

            // Guardar en caché
            this.messageCache.set(conversationId, messages);

            return messages;
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            throw error;
        }
    }

    /**
     * Renderizar área de chat
     */
    renderChatArea(conversation) {
        const chatArea = document.getElementById('chat-area');
        const template = document.getElementById('active-chat-template');
        const clone = template.content.cloneNode(true);

        // Configurar información del usuario
        const otherUserName = this.getOtherUserName(conversation);
        const otherUserInitial = otherUserName.charAt(0).toUpperCase();
        const isOnline = conversation.other_user_is_online || false;

        clone.querySelector('#chat-avatar').textContent = otherUserInitial;
        clone.querySelector('#chat-user-name').textContent = otherUserName;

        const statusEl = clone.querySelector('#chat-user-status');
        statusEl.textContent = isOnline ? 'Conectado' : 'Desconectado';
        statusEl.classList.toggle('offline', !isOnline);

        // Reemplazar contenido
        chatArea.innerHTML = '';
        chatArea.appendChild(clone);

        // Renderizar mensajes
        this.renderMessages(this.currentConversation.id);

        // Focus en el input
        setTimeout(() => {
            document.getElementById('message-input')?.focus();
        }, 100);
    }

    /**
     * Renderizar mensajes
     */
    renderMessages(conversationId) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        const messages = this.messageCache.get(conversationId) || [];

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No hay mensajes aún. ¡Envía el primer mensaje!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messages.map((msg, index) => {
            const isSent = msg.sender_id === this.currentUserId;
            const showDate = this.shouldShowDateDivider(messages, index);
            const senderInitial = msg.sender_nickname ? msg.sender_nickname.charAt(0).toUpperCase() : '?';
            const messageTime = this.formatTime(msg.created_at);

            return `
                ${showDate ? `<div class="date-divider"><span>${this.formatDate(msg.created_at)}</span></div>` : ''}
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-avatar">${senderInitial}</div>
                    <div class="message-content">
                        <div class="message-bubble">
                            ${this.escapeHtml(msg.message_text)}
                        </div>
                        <div class="message-meta">
                            <span>${messageTime}</span>
                            ${isSent ? `<span class="message-status">${msg.is_read ? '✓✓' : '✓'}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll al final
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Enviar mensaje
     */
    async sendMessage(conversationId, messageText) {
        try {
            if (!messageText || !messageText.trim()) {
                return;
            }

            console.log('📤 Sending message to conversation:', conversationId);

            const formData = new FormData();
            formData.append('messageText', messageText.trim());

            const response = await this.apiService.apiCall(
                `/messages/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            console.log('✅ Message sent:', response);

            // Limpiar input
            const input = document.getElementById('message-input');
            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }

            // El mensaje se agregará vía WebSocket event 'new_message'
        } catch (error) {
            console.error('❌ Error sending message:', error);
            console.error('Error details:', {
                status: error.status,
                message: error.message,
                conversationId: conversationId,
                currentConversation: this.currentConversation
            });

            // Provide more specific error messages
            if (error.status === 403) {
                this.showError('No tienes permiso para enviar mensajes en esta conversación.');
            } else if (error.status === 404) {
                this.showError('La conversación ya no existe. Recarga la página.');
                await this.loadConversations();
            } else if (error.status === 400) {
                this.showError('El mensaje no es válido. Verifica que no esté vacío y que no sea demasiado largo.');
            } else {
                this.showError('Error al enviar el mensaje. Verifica tu conexión e intenta nuevamente.');
            }
        }
    }

    /**
     * Manejar nuevo mensaje recibido
     */
    handleNewMessage(message) {
        const conversationId = message.conversation_id;

        // Actualizar caché de mensajes
        let messages = this.messageCache.get(conversationId) || [];
        messages.push(message);
        this.messageCache.set(conversationId, messages);

        // Si es la conversación actual, renderizar
        if (this.currentConversation && this.currentConversation.id === conversationId) {
            this.renderMessages(conversationId);

            // Marcar como leído si el usuario no es el remitente
            if (message.sender_id !== this.currentUserId) {
                this.markConversationAsRead(conversationId);
            }
        }

        // Actualizar lista de conversaciones
        this.loadConversations();
    }

    /**
     * Manejar indicador de escritura
     */
    handleTypingIndicator(data) {
        if (!this.currentConversation || this.currentConversation.id !== data.conversationId) {
            return;
        }

        if (data.userId === this.currentUserId) {
            return; // Ignorar nuestro propio typing
        }

        const container = document.getElementById('typing-indicator-container');
        if (!container) return;

        if (data.isTyping) {
            container.innerHTML = `
                <div class="typing-indicator-message">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    /**
     * Manejar mensaje leído
     */
    handleMessageRead(data) {
        if (!this.currentConversation || this.currentConversation.id !== data.conversationId) {
            return;
        }

        // Actualizar estado visual de los mensajes
        const messages = this.messageCache.get(data.conversationId) || [];
        const message = messages.find(m => m.id === data.messageId);
        if (message) {
            message.is_read = true;
            this.renderMessages(data.conversationId);
        }
    }

    /**
     * Manejar cambio de estado de usuario
     */
    handleUserStatusChange(data) {
        // Actualizar en la lista de conversaciones
        const conversation = this.conversations.find(c =>
            c.user1_id === data.userId || c.user2_id === data.userId
        );

        if (conversation) {
            conversation.other_user_is_online = data.isOnline;
            this.renderConversationsList(this.conversations);

            // Si es la conversación actual, actualizar el header
            if (this.currentConversation && this.currentConversation.id === conversation.id) {
                const statusEl = document.getElementById('chat-user-status');
                if (statusEl) {
                    statusEl.textContent = data.isOnline ? 'Conectado' : 'Desconectado';
                    statusEl.classList.toggle('offline', !data.isOnline);
                }
            }
        }
    }

    /**
     * Manejar conversación leída
     */
    handleConversationRead(data) {
        if (!this.currentConversation || this.currentConversation.id !== data.conversationId) {
            return;
        }

        // Marcar todos los mensajes como leídos
        const messages = this.messageCache.get(data.conversationId) || [];
        messages.forEach(m => {
            if (m.sender_id === this.currentUserId) {
                m.is_read = true;
            }
        });

        this.renderMessages(data.conversationId);
    }

    /**
     * Marcar conversación como leída
     */
    async markConversationAsRead(conversationId) {
        try {
            await this.apiService.apiCall(
                `/messages/conversations/${conversationId}/read-all`,
                { method: 'PATCH' }
            );

            // Emitir evento WebSocket
            this.socket.emit('mark_conversation_read', { conversationId });

            // Actualizar contador de no leídos
            this.updateUnreadCount();
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda de conversaciones
        const searchBox = document.getElementById('search-conversations');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.loadConversations(e.target.value);
            });
        }

        // Delegación de eventos para el área de chat (se crea dinámicamente)
        document.addEventListener('input', (e) => {
            if (e.target.id === 'message-input') {
                this.handleMessageInput(e.target);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'send-btn') {
                this.handleSendMessage();
            }
            if (e.target.id === 'attach-btn') {
                document.getElementById('file-input')?.click();
            }
        });
    }

    /**
     * Manejar input de mensaje
     */
    handleMessageInput(textarea) {
        // Auto-resize
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

        // Emitir typing indicator
        if (this.currentConversation) {
            this.socket.emit('typing_start', {
                conversationId: this.currentConversation.id
            });

            // Limpiar timeout anterior
            if (this.typingTimeouts.has(this.currentConversation.id)) {
                clearTimeout(this.typingTimeouts.get(this.currentConversation.id));
            }

            // Nuevo timeout para dejar de escribir
            const timeout = setTimeout(() => {
                this.socket.emit('typing_stop', {
                    conversationId: this.currentConversation.id
                });
            }, 2000);

            this.typingTimeouts.set(this.currentConversation.id, timeout);
        }
    }

    /**
     * Manejar envío de mensaje
     */
    handleSendMessage() {
        const input = document.getElementById('message-input');
        if (!input || !this.currentConversation) return;

        const messageText = input.value.trim();
        if (messageText) {
            this.sendMessage(this.currentConversation.id, messageText);

            // Detener typing indicator
            this.socket.emit('typing_stop', {
                conversationId: this.currentConversation.id
            });
        }
    }

    /**
     * Actualizar contador de mensajes no leídos
     */
    async updateUnreadCount() {
        try {
            const data = await this.apiService.apiCall('/messages/unread-count');

            // Actualizar badge en el header
            const badge = document.getElementById('messages-unread-badge');
            if (badge) {
                if (data.total_unread > 0) {
                    badge.textContent = data.total_unread > 99 ? '99+' : data.total_unread;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    /**
     * Iniciar polling de contador de no leídos
     */
    startUnreadCountPolling() {
        this.updateUnreadCount();
        setInterval(() => this.updateUnreadCount(), 30000); // Cada 30 segundos
    }

    /**
     * Utilidades
     */

    getOtherUserName(conversation) {
        if (conversation.user1_id === this.currentUserId) {
            return conversation.user2_nickname || 'Usuario';
        } else {
            return conversation.user1_nickname || 'Usuario';
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoy';
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        }

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }

    shouldShowDateDivider(messages, index) {
        if (index === 0) return true;

        const currentMsg = messages[index];
        const prevMsg = messages[index - 1];

        const currentDate = new Date(currentMsg.created_at).toDateString();
        const prevDate = new Date(prevMsg.created_at).toDateString();

        return currentDate !== prevDate;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        console.error('Error:', message);
        // TODO: Implementar sistema de notificaciones toast
        alert(message);
    }

    // Métodos placeholder para botones de acción
    searchInConversation() {
        console.log('Search in conversation - To be implemented');
    }

    showConversationInfo() {
        console.log('Show conversation info - To be implemented');
    }
}
