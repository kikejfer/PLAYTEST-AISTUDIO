import React, { useState, useEffect, useCallback } from 'react';
import chatService from '../../services/chatService';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import './ChatWidget.css';

/**
 * Widget principal de chat - puede ser flotante o integrado
 */
const ChatWidget = ({
    mode = 'floating', // 'floating' | 'integrated'
    initialConversationId = null,
    onClose = null,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(mode === 'integrated');
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Inicializar conexión WebSocket
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            chatService.connect(token);
        }

        // Listeners de WebSocket
        const unsubscribeConnected = chatService.on('connected', () => {
            setIsConnected(true);
            loadConversations();
            loadUnreadCount();
        });

        const unsubscribeDisconnected = chatService.on('disconnected', () => {
            setIsConnected(false);
        });

        const unsubscribeNewMessage = chatService.on('new_message', handleNewMessage);

        return () => {
            unsubscribeConnected();
            unsubscribeDisconnected();
            unsubscribeNewMessage();
        };
    }, []);

    // Cargar conversaciones
    const loadConversations = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await chatService.getConversations({ limit: 50 });
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cargar conteo de no leídos
    const loadUnreadCount = useCallback(async () => {
        try {
            const data = await chatService.getUnreadCount();
            setUnreadCount(data.total_unread || 0);
        } catch (error) {
            console.error('Error cargando conteo de no leídos:', error);
        }
    }, []);

    // Manejar nuevo mensaje recibido
    const handleNewMessage = useCallback((message) => {
        // Actualizar última actividad de conversación
        setConversations(prev => {
            const updated = [...prev];
            const index = updated.findIndex(c => c.conversation_id === message.conversation_id);

            if (index >= 0) {
                const conv = { ...updated[index] };
                conv.last_message_text = message.message_text;
                conv.last_message_at = message.created_at;

                // Si no es la conversación activa, incrementar no leídos
                if (message.conversation_id !== activeConversationId) {
                    conv.unread_count = (parseInt(conv.unread_count) || 0) + 1;
                    setUnreadCount(prev => prev + 1);
                }

                // Mover al principio
                updated.splice(index, 1);
                updated.unshift(conv);
            }

            return updated;
        });

        // Si el chat está cerrado, mostrar notificación
        if (!isOpen && mode === 'floating') {
            // Aquí se podría mostrar una notificación del navegador
            showNotification(message);
        }
    }, [activeConversationId, isOpen, mode]);

    // Mostrar notificación del navegador
    const showNotification = (message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nuevo mensaje', {
                body: `${message.sender_nickname}: ${message.message_text.substring(0, 50)}...`,
                icon: '/logo.png'
            });
        }
    };

    // Seleccionar conversación
    const handleSelectConversation = useCallback((conversationId) => {
        setActiveConversationId(conversationId);

        // Marcar como leída
        chatService.markConversationAsRead(conversationId);
        chatService.markConversationAsReadAPI(conversationId);

        // Actualizar contadores
        const conv = conversations.find(c => c.conversation_id === conversationId);
        if (conv && conv.unread_count > 0) {
            setUnreadCount(prev => Math.max(0, prev - parseInt(conv.unread_count)));
            setConversations(prev => prev.map(c =>
                c.conversation_id === conversationId
                    ? { ...c, unread_count: 0 }
                    : c
            ));
        }
    }, [conversations]);

    // Volver a la lista
    const handleBackToList = useCallback(() => {
        setActiveConversationId(null);
    }, []);

    // Toggle widget
    const toggleWidget = () => {
        if (mode === 'floating') {
            setIsOpen(!isOpen);
            if (!isOpen) {
                loadConversations();
                loadUnreadCount();
            }
        }
    };

    // Cerrar widget
    const handleClose = () => {
        if (onClose) {
            onClose();
        } else if (mode === 'floating') {
            setIsOpen(false);
        }
    };

    // Si está en modo integrado, siempre mostrar
    const shouldShow = mode === 'integrated' || isOpen;

    return (
        <>
            {/* Botón flotante para abrir el chat */}
            {mode === 'floating' && !isOpen && (
                <button
                    className="chat-widget-toggle"
                    onClick={toggleWidget}
                    aria-label="Abrir chat"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="currentColor"
                    >
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                    {unreadCount > 0 && (
                        <span className="chat-widget-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                </button>
            )}

            {/* Widget de chat */}
            {shouldShow && (
                <div className={`chat-widget ${mode} ${className}`}>
                    {/* Header */}
                    <div className="chat-widget-header">
                        <div className="chat-widget-header-left">
                            {activeConversationId && (
                                <button
                                    className="chat-widget-back-btn"
                                    onClick={handleBackToList}
                                    aria-label="Volver"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                                    </svg>
                                </button>
                            )}
                            <h3>
                                {activeConversationId ? 'Conversación' : 'Mensajes'}
                            </h3>
                        </div>

                        <div className="chat-widget-header-right">
                            {/* Indicador de conexión */}
                            <div
                                className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
                                title={isConnected ? 'Conectado' : 'Desconectado'}
                            />

                            {/* Botón cerrar */}
                            {mode === 'floating' && (
                                <button
                                    className="chat-widget-close-btn"
                                    onClick={handleClose}
                                    aria-label="Cerrar"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="chat-widget-content">
                        {!activeConversationId ? (
                            <ConversationList
                                conversations={conversations}
                                onSelectConversation={handleSelectConversation}
                                onRefresh={loadConversations}
                                isLoading={isLoading}
                            />
                        ) : (
                            <MessageThread
                                conversationId={activeConversationId}
                                onBack={handleBackToList}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
