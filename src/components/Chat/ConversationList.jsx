import React, { useState, useMemo } from 'react';
import chatService from '../../services/chatService';

/**
 * Lista de conversaciones del usuario
 */
const ConversationList = ({
    conversations = [],
    onSelectConversation,
    onRefresh,
    isLoading = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'class', 'block', 'general'

    // Filtrar y buscar conversaciones
    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        // Filtrar por tipo
        if (filterType !== 'all') {
            filtered = filtered.filter(conv => conv.context_type === filterType);
        }

        // Buscar por texto
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(conv =>
                conv.other_user_nickname?.toLowerCase().includes(query) ||
                conv.last_message_text?.toLowerCase().includes(query) ||
                conv.context_info?.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [conversations, filterType, searchQuery]);

    // Formatear tiempo relativo
    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInHours < 24) return `${diffInHours}h`;
        if (diffInDays < 7) return `${diffInDays}d`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Renderizar badge de contexto
    const renderContextBadge = (conversation) => {
        if (!conversation.context_type || conversation.context_type === 'general') {
            return null;
        }

        const labels = {
            class: { text: 'Clase', icon: '🎓' },
            block: { text: 'Bloque', icon: '🧩' }
        };

        const badge = labels[conversation.context_type];
        if (!badge) return null;

        return (
            <span className="conversation-context-badge" title={conversation.context_info?.name}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    return (
        <div className="conversation-list">
            {/* Header con búsqueda y filtros */}
            <div className="conversation-list-header">
                <div className="conversation-search">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar conversaciones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchQuery('')}
                            aria-label="Limpiar búsqueda"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filtros */}
                <div className="conversation-filters">
                    <button
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'class' ? 'active' : ''}`}
                        onClick={() => setFilterType('class')}
                    >
                        Clases
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'block' ? 'active' : ''}`}
                        onClick={() => setFilterType('block')}
                    >
                        Bloques
                    </button>
                </div>

                {/* Botón refrescar */}
                <button
                    className="refresh-btn"
                    onClick={onRefresh}
                    disabled={isLoading}
                    aria-label="Refrescar"
                    title="Refrescar conversaciones"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="currentColor"
                        className={isLoading ? 'spinning' : ''}
                    >
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                </button>
            </div>

            {/* Lista de conversaciones */}
            <div className="conversation-list-content">
                {isLoading && conversations.length === 0 ? (
                    <div className="conversation-list-loading">
                        <div className="spinner"></div>
                        <p>Cargando conversaciones...</p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="conversation-list-empty">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                        <p>
                            {searchQuery || filterType !== 'all'
                                ? 'No se encontraron conversaciones'
                                : 'No hay conversaciones aún'
                            }
                        </p>
                        {searchQuery || filterType !== 'all' ? (
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterType('all');
                                }}
                            >
                                Limpiar filtros
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <>
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.conversation_id}
                                className={`conversation-item ${conversation.unread_count > 0 ? 'unread' : ''} ${conversation.is_pinned ? 'pinned' : ''}`}
                                onClick={() => onSelectConversation(conversation.conversation_id)}
                            >
                                {/* Avatar */}
                                <div className="conversation-avatar">
                                    {conversation.other_user_avatar ? (
                                        <img
                                            src={conversation.other_user_avatar}
                                            alt={conversation.other_user_nickname}
                                        />
                                    ) : (
                                        <div className="conversation-avatar-placeholder">
                                            {conversation.other_user_nickname?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    {/* Indicador online (futuro) */}
                                    {/* <span className="online-indicator"></span> */}
                                </div>

                                {/* Contenido */}
                                <div className="conversation-content">
                                    <div className="conversation-header">
                                        <h4 className="conversation-name">
                                            {conversation.other_user_nickname || 'Usuario'}
                                        </h4>
                                        <span className="conversation-time">
                                            {formatTime(conversation.last_message_at)}
                                        </span>
                                    </div>

                                    <div className="conversation-preview">
                                        <div className="conversation-message">
                                            {conversation.last_message_text ? (
                                                <>
                                                    {conversation.last_message_sender_id === conversation.other_user_id
                                                        ? ''
                                                        : 'Tú: '
                                                    }
                                                    {conversation.last_message_text.substring(0, 60)}
                                                    {conversation.last_message_text.length > 60 ? '...' : ''}
                                                </>
                                            ) : (
                                                <span className="no-messages">Sin mensajes aún</span>
                                            )}
                                        </div>

                                        {conversation.unread_count > 0 && (
                                            <span className="unread-badge">
                                                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                            </span>
                                        )}
                                    </div>

                                    {/* Badge de contexto */}
                                    {renderContextBadge(conversation)}
                                </div>

                                {/* Indicador de anclado */}
                                {conversation.is_pinned && (
                                    <div className="pinned-indicator" title="Conversación anclada">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                                        </svg>
                                    </div>
                                )}

                                {/* Indicador de silenciado */}
                                {conversation.is_muted && (
                                    <div className="muted-indicator" title="Conversación silenciada">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
