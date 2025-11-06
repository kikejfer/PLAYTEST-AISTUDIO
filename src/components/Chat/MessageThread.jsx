import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../../services/chatService';
import MessageInput from './MessageInput';

/**
 * Hilo de mensajes de una conversación
 */
const MessageThread = ({ conversationId, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef(null);

    // Cargar conversación y mensajes iniciales
    useEffect(() => {
        if (conversationId) {
            loadConversation();
            loadMessages();
            joinConversation();
        }

        return () => {
            if (conversationId) {
                leaveConversation();
            }
        };
    }, [conversationId]);

    // Listeners de WebSocket
    useEffect(() => {
        const unsubscribeNewMessage = chatService.on('new_message', handleNewMessage);
        const unsubscribeTyping = chatService.on('user_typing', handleUserTyping);
        const unsubscribeRead = chatService.on('message_read', handleMessageRead);

        return () => {
            unsubscribeNewMessage();
            unsubscribeTyping();
            unsubscribeRead();
        };
    }, [conversationId, messages]);

    // Scroll automático al final
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto'
        });
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(false);
        }
    }, [messages.length]);

    // Cargar información de la conversación
    const loadConversation = async () => {
        try {
            const data = await chatService.getConversation(conversationId);
            setConversation(data);
        } catch (error) {
            console.error('Error cargando conversación:', error);
        }
    };

    // Cargar mensajes
    const loadMessages = async (beforeId = null) => {
        try {
            setIsLoading(true);
            const params = { limit: 50 };
            if (beforeId) params.beforeId = beforeId;

            const data = await chatService.getMessages(conversationId, params);
            const newMessages = data.messages || [];

            if (beforeId) {
                setMessages(prev => [...newMessages, ...prev]);
            } else {
                setMessages(newMessages);
                lastMessageIdRef.current = newMessages[newMessages.length - 1]?.id;
            }

            setHasMore(newMessages.length === 50);
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Unirse a la conversación via WebSocket
    const joinConversation = () => {
        chatService.joinConversation(conversationId);
    };

    // Salir de la conversación
    const leaveConversation = () => {
        chatService.leaveConversation(conversationId);
    };

    // Manejar nuevo mensaje recibido
    const handleNewMessage = useCallback((message) => {
        if (message.conversation_id === conversationId) {
            setMessages(prev => {
                // Evitar duplicados
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });

            // Marcar como leído si no es del usuario actual
            const currentUserId = conversation?.user1_id || conversation?.user2_id;
            if (message.sender_id !== currentUserId) {
                chatService.markMessageAsRead(message.id, conversationId);
            }

            scrollToBottom();
        }
    }, [conversationId, conversation]);

    // Manejar indicador de escritura
    const handleUserTyping = useCallback((data) => {
        if (data.conversationId === conversationId) {
            setIsTyping(data.isTyping);
            setTypingUser(data.isTyping ? data.nickname : null);
        }
    }, [conversationId]);

    // Manejar mensaje leído
    const handleMessageRead = useCallback((data) => {
        if (data.conversationId === conversationId) {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                    ? { ...msg, is_read: true, read_at: data.readAt }
                    : msg
            ));
        }
    }, [conversationId]);

    // Enviar mensaje
    const handleSendMessage = async (messageText, attachments) => {
        try {
            const response = await chatService.sendMessage(conversationId, messageText, attachments);

            if (response.data) {
                // El mensaje se agregará automáticamente via WebSocket
                // pero lo agregamos localmente por si acaso
                setMessages(prev => {
                    if (prev.some(m => m.id === response.data.id)) {
                        return prev;
                    }
                    return [...prev, response.data];
                });
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            throw error;
        }
    };

    // Formatear timestamp
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // Agrupar mensajes por fecha
    const groupMessagesByDate = (messages) => {
        const groups = [];
        let currentDate = null;

        messages.forEach(msg => {
            const msgDate = new Date(msg.created_at).toLocaleDateString('es-ES');

            if (msgDate !== currentDate) {
                groups.push({ type: 'date', date: msgDate });
                currentDate = msgDate;
            }

            groups.push({ type: 'message', data: msg });
        });

        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    // Determinar si un mensaje es del usuario actual
    const isOwnMessage = (message) => {
        // Simplificación: comparar con el sender_id del último mensaje enviado
        // En producción, deberías obtener el userId actual del contexto/auth
        return message.sender_id !== conversation?.other_user_id;
    };

    if (!conversation) {
        return (
            <div className="message-thread-loading">
                <div className="spinner"></div>
                <p>Cargando conversación...</p>
            </div>
        );
    }

    return (
        <div className="message-thread">
            {/* Header con info del destinatario */}
            <div className="message-thread-header">
                <div className="recipient-info">
                    <div className="recipient-avatar">
                        {conversation.other_user_avatar ? (
                            <img
                                src={conversation.other_user_avatar}
                                alt={conversation.other_user_nickname}
                            />
                        ) : (
                            <div className="recipient-avatar-placeholder">
                                {conversation.other_user_nickname?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="recipient-details">
                        <h4>{conversation.other_user_nickname}</h4>
                        {conversation.context_type && conversation.context_type !== 'general' && (
                            <span className="context-label">
                                {conversation.context_type === 'class' ? '🎓 Clase' : '🧩 Bloque'}
                                {conversation.context_info?.name && `: ${conversation.context_info.name}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de mensajes */}
            <div className="message-thread-messages" ref={messagesContainerRef}>
                {isLoading && messages.length === 0 ? (
                    <div className="messages-loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {messageGroups.map((group, index) =>
                            group.type === 'date' ? (
                                <div key={`date-${index}`} className="message-date-divider">
                                    <span>{group.date}</span>
                                </div>
                            ) : (
                                <Message
                                    key={group.data.id}
                                    message={group.data}
                                    isOwn={isOwnMessage(group.data)}
                                    formatTime={formatMessageTime}
                                />
                            )
                        )}

                        {/* Indicador de escritura */}
                        {isTyping && (
                            <div className="typing-indicator">
                                <div className="typing-indicator-avatar">
                                    {conversation.other_user_avatar ? (
                                        <img
                                            src={conversation.other_user_avatar}
                                            alt={typingUser}
                                        />
                                    ) : (
                                        <div className="typing-indicator-avatar-placeholder">
                                            {conversation.other_user_nickname?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="typing-indicator-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input para enviar mensajes */}
            <MessageInput
                conversationId={conversationId}
                onSend={handleSendMessage}
                onTypingStart={() => chatService.startTyping(conversationId)}
                onTypingStop={() => chatService.stopTyping(conversationId)}
            />
        </div>
    );
};

/**
 * Componente individual de mensaje
 */
const Message = ({ message, isOwn, formatTime }) => {
    return (
        <div className={`message ${isOwn ? 'own' : 'other'}`}>
            {!isOwn && (
                <div className="message-avatar">
                    {message.sender_avatar ? (
                        <img src={message.sender_avatar} alt={message.sender_nickname} />
                    ) : (
                        <div className="message-avatar-placeholder">
                            {message.sender_nickname?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            <div className="message-content-wrapper">
                {!isOwn && (
                    <div className="message-sender-name">{message.sender_nickname}</div>
                )}

                <div className="message-bubble">
                    <div className="message-text">{message.message_text}</div>

                    {/* Adjuntos */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                            {message.attachments.map(att => (
                                <a
                                    key={att.id}
                                    href={chatService.getAttachmentUrl(att.filename)}
                                    download={att.original_name}
                                    className="message-attachment"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                    </svg>
                                    <span>{att.original_name}</span>
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="message-meta">
                        <span className="message-time">{formatTime(message.created_at)}</span>
                        {isOwn && (
                            <span className="message-status">
                                {message.is_read ? (
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#4fc3f7">
                                        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageThread;
