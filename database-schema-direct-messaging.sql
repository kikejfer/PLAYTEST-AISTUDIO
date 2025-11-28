-- Sistema de Mensajería Directa PLAYTEST
-- Chat directo entre Profesores-Alumnos y Creadores-Jugadores
-- Complementa el sistema de tickets formales (database-schema-communication.sql)

-- ============================================================================
-- TABLA PRINCIPAL: CONVERSACIONES
-- ============================================================================

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,

    -- Participantes (siempre dos usuarios)
    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Contexto de la conversación
    context_type VARCHAR(20) NOT NULL, -- 'class', 'block', 'general'
    context_id INTEGER, -- class_id o block_id según el contexto

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Estado de la conversación
    is_active BOOLEAN DEFAULT true,
    is_archived_by_user1 BOOLEAN DEFAULT false,
    is_archived_by_user2 BOOLEAN DEFAULT false,

    -- Prevenir duplicados (orden no importa)
    CONSTRAINT unique_conversation UNIQUE (
        LEAST(user1_id, user2_id),
        GREATEST(user1_id, user2_id),
        context_type,
        COALESCE(context_id, 0)
    )
);

-- ============================================================================
-- TABLA: MENSAJES DIRECTOS
-- ============================================================================

CREATE TABLE direct_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,

    -- Remitente y receptor
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Contenido del mensaje
    message_text TEXT NOT NULL,
    message_html TEXT, -- Para renderizado markdown/formato

    -- Metadata del mensaje
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,

    -- Estado de lectura
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Tipo de mensaje especial
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'system', 'attachment'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete

    -- Metadata adicional (para extensiones futuras)
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- TABLA: ADJUNTOS DE MENSAJES (Compartida con tickets)
-- ============================================================================

-- Tabla genérica para adjuntos tanto de tickets como de mensajes directos
CREATE TABLE message_attachments (
    id SERIAL PRIMARY KEY,

    -- Referencias opcionales (uno u otro debe estar presente)
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES ticket_messages(id) ON DELETE CASCADE,
    direct_message_id INTEGER REFERENCES direct_messages(id) ON DELETE CASCADE,

    -- Info del archivo
    filename VARCHAR(255) NOT NULL, -- Nombre generado en servidor
    original_name VARCHAR(255) NOT NULL, -- Nombre original del archivo
    file_type VARCHAR(100) NOT NULL, -- MIME type
    file_size INTEGER NOT NULL, -- Bytes
    file_path VARCHAR(500) NOT NULL, -- Path relativo en servidor

    -- Metadata
    uploaded_by INTEGER REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_image BOOLEAN DEFAULT false,
    thumbnail_path VARCHAR(500), -- Para imágenes

    -- Validación: al menos una referencia debe existir
    CONSTRAINT check_attachment_reference CHECK (
        ticket_id IS NOT NULL OR
        message_id IS NOT NULL OR
        direct_message_id IS NOT NULL
    )
);

-- ============================================================================
-- TABLA: ESTADO DE ESCRITURA (Typing indicators)
-- ============================================================================

CREATE TABLE typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Estado
    is_typing BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Auto-expiración (después de 5 segundos)
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 seconds'),

    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- TABLA: ESTADO ONLINE DE USUARIOS
-- ============================================================================

CREATE TABLE user_online_status (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Estado online
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- WebSocket connection tracking
    socket_id VARCHAR(100), -- ID del socket activo
    connected_at TIMESTAMP,

    -- Metadata
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: PREFERENCIAS DE NOTIFICACIÓN (por conversación)
-- ============================================================================

CREATE TABLE conversation_settings (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Configuración de notificaciones
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,

    -- Configuración visual
    is_pinned BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función: Actualizar last_message_at en conversación
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Función: Crear notificación al recibir mensaje directo
CREATE OR REPLACE FUNCTION notify_direct_message()
RETURNS TRIGGER AS $$
DECLARE
    settings_record RECORD;
    sender_name VARCHAR(100);
BEGIN
    -- Obtener configuración de notificaciones del receptor
    SELECT cs.notifications_enabled, cs.is_muted
    INTO settings_record
    FROM conversation_settings cs
    WHERE cs.conversation_id = NEW.conversation_id
    AND cs.user_id = NEW.recipient_id;

    -- Si no hay configuración, asumir que sí quiere notificaciones
    IF settings_record IS NULL THEN
        settings_record.notifications_enabled := true;
        settings_record.is_muted := false;
    END IF;

    -- Solo crear notificación si está habilitada y no muteada
    IF settings_record.notifications_enabled AND NOT settings_record.is_muted THEN
        -- Obtener nombre del remitente
        SELECT nickname INTO sender_name FROM users WHERE id = NEW.sender_id;

        -- Crear notificación
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            metadata
        ) VALUES (
            NEW.recipient_id,
            'direct_message',
            'Nuevo mensaje de ' || sender_name,
            LEFT(NEW.message_text, 100), -- Primeros 100 caracteres
            '/chat/' || NEW.conversation_id,
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id,
                'message_id', NEW.id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_direct_message
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    WHEN (NEW.message_type = 'text') -- Solo notificar mensajes de texto normales
    EXECUTE FUNCTION notify_direct_message();

-- Función: Marcar mensaje como leído
CREATE OR REPLACE FUNCTION mark_message_as_read(
    p_message_id INTEGER,
    p_user_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Verificar que el usuario es el receptor
    SELECT * INTO message_record
    FROM direct_messages
    WHERE id = p_message_id AND recipient_id = p_user_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Marcar como leído
    UPDATE direct_messages
    SET is_read = true, read_at = NOW()
    WHERE id = p_message_id AND is_read = false;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función: Marcar todos los mensajes de una conversación como leídos
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
    p_conversation_id INTEGER,
    p_user_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE direct_messages
    SET is_read = true, read_at = NOW()
    WHERE conversation_id = p_conversation_id
    AND recipient_id = p_user_id
    AND is_read = false
    AND deleted_at IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener conversaciones de un usuario con info del último mensaje
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    conversation_id INTEGER,
    other_user_id INTEGER,
    other_user_nickname VARCHAR,
    other_user_avatar VARCHAR,
    context_type VARCHAR,
    context_id INTEGER,
    last_message_text TEXT,
    last_message_at TIMESTAMP,
    last_message_sender_id INTEGER,
    unread_count BIGINT,
    is_archived BOOLEAN,
    is_pinned BOOLEAN,
    is_muted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as conversation_id,

        -- Determinar el "otro" usuario
        CASE
            WHEN c.user1_id = p_user_id THEN c.user2_id
            ELSE c.user1_id
        END as other_user_id,

        CASE
            WHEN c.user1_id = p_user_id THEN u2.nickname
            ELSE u1.nickname
        END as other_user_nickname,

        CASE
            WHEN c.user1_id = p_user_id THEN u2.avatar_url
            ELSE u1.avatar_url
        END as other_user_avatar,

        c.context_type::VARCHAR,
        c.context_id,

        -- Último mensaje
        (SELECT dm.message_text
         FROM direct_messages dm
         WHERE dm.conversation_id = c.id
         AND dm.deleted_at IS NULL
         ORDER BY dm.created_at DESC
         LIMIT 1) as last_message_text,

        c.last_message_at,

        (SELECT dm.sender_id
         FROM direct_messages dm
         WHERE dm.conversation_id = c.id
         AND dm.deleted_at IS NULL
         ORDER BY dm.created_at DESC
         LIMIT 1) as last_message_sender_id,

        -- Contar mensajes no leídos
        (SELECT COUNT(*)
         FROM direct_messages dm
         WHERE dm.conversation_id = c.id
         AND dm.recipient_id = p_user_id
         AND dm.is_read = false
         AND dm.deleted_at IS NULL) as unread_count,

        -- Estado de archivo
        CASE
            WHEN c.user1_id = p_user_id THEN c.is_archived_by_user1
            ELSE c.is_archived_by_user2
        END as is_archived,

        -- Configuración
        COALESCE(cs.is_pinned, false) as is_pinned,
        COALESCE(cs.is_muted, false) as is_muted

    FROM conversations c
    LEFT JOIN users u1 ON c.user1_id = u1.id
    LEFT JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN conversation_settings cs ON cs.conversation_id = c.id AND cs.user_id = p_user_id

    WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND c.is_active = true
    AND (
        (c.user1_id = p_user_id AND c.is_archived_by_user1 = false) OR
        (c.user2_id = p_user_id AND c.is_archived_by_user2 = false)
    )

    ORDER BY
        COALESCE(cs.is_pinned, false) DESC, -- Pinned primero
        c.last_message_at DESC

    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener o crear una conversación entre dos usuarios
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user1_id INTEGER,
    p_user2_id INTEGER,
    p_context_type VARCHAR,
    p_context_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    conversation_id INTEGER;
    min_user_id INTEGER;
    max_user_id INTEGER;
BEGIN
    -- Ordenar IDs para búsqueda consistente
    min_user_id := LEAST(p_user1_id, p_user2_id);
    max_user_id := GREATEST(p_user1_id, p_user2_id);

    -- Buscar conversación existente
    SELECT id INTO conversation_id
    FROM conversations
    WHERE user1_id = min_user_id
    AND user2_id = max_user_id
    AND context_type = p_context_type
    AND COALESCE(context_id, 0) = COALESCE(p_context_id, 0);

    -- Si no existe, crear nueva
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id, context_type, context_id)
        VALUES (min_user_id, max_user_id, p_context_type, p_context_id)
        RETURNING id INTO conversation_id;
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Limpiar estados de typing expirados (llamar desde cron)
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM typing_status
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Conversaciones
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_context ON conversations(context_type, context_id);
CREATE INDEX idx_conversations_active ON conversations(is_active) WHERE is_active = true;

-- Mensajes directos
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Adjuntos
CREATE INDEX idx_message_attachments_ticket ON message_attachments(ticket_id);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_direct_message ON message_attachments(direct_message_id);
CREATE INDEX idx_message_attachments_uploaded_by ON message_attachments(uploaded_by);

-- Estado de escritura
CREATE INDEX idx_typing_status_conversation ON typing_status(conversation_id);
CREATE INDEX idx_typing_status_expires ON typing_status(expires_at);

-- Estado online
CREATE INDEX idx_user_online_status_online ON user_online_status(is_online, last_seen DESC);

-- Configuración de conversaciones
CREATE INDEX idx_conversation_settings_user ON conversation_settings(user_id);
CREATE INDEX idx_conversation_settings_pinned ON conversation_settings(is_pinned) WHERE is_pinned = true;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Mensajes con información completa de usuarios
CREATE VIEW direct_messages_complete AS
SELECT
    dm.id,
    dm.conversation_id,
    dm.message_text,
    dm.message_html,
    dm.is_read,
    dm.read_at,
    dm.is_edited,
    dm.edited_at,
    dm.message_type,
    dm.created_at,

    -- Información del remitente
    sender.id as sender_id,
    sender.nickname as sender_nickname,
    sender.avatar_url as sender_avatar,

    -- Información del receptor
    recipient.id as recipient_id,
    recipient.nickname as recipient_nickname,
    recipient.avatar_url as recipient_avatar,

    -- Adjuntos
    (SELECT COUNT(*) FROM message_attachments ma
     WHERE ma.direct_message_id = dm.id) as attachment_count

FROM direct_messages dm
LEFT JOIN users sender ON dm.sender_id = sender.id
LEFT JOIN users recipient ON dm.recipient_id = recipient.id
WHERE dm.deleted_at IS NULL;

-- Vista: Contadores de mensajes no leídos por usuario
CREATE VIEW unread_message_counts AS
SELECT
    dm.recipient_id as user_id,
    dm.conversation_id,
    COUNT(*) as unread_count,
    MAX(dm.created_at) as latest_unread_at
FROM direct_messages dm
WHERE dm.is_read = false
AND dm.deleted_at IS NULL
GROUP BY dm.recipient_id, dm.conversation_id;

-- ============================================================================
-- DATOS INICIALES / SEEDS
-- ============================================================================

-- Nota: No hay datos semilla para este sistema, se crean dinámicamente

-- ============================================================================
-- NOTAS PARA MIGRACIÓN
-- ============================================================================

/*
MIGRACIÓN DESDE SISTEMA ACTUAL:

1. Este esquema es complementario a database-schema-communication.sql
2. Los tickets formales siguen usando su propio sistema
3. Las notificaciones son compartidas (tabla `notifications` ya existe)
4. Para migrar ticket_attachments a message_attachments:
   - ALTER TABLE ticket_attachments RENAME TO message_attachments_old;
   - Crear nueva tabla message_attachments
   - Migrar datos: INSERT INTO message_attachments SELECT * FROM message_attachments_old;
   - DROP TABLE message_attachments_old;

INTEGRACIÓN CON WEBSOCKET:
- user_online_status.socket_id almacena el ID de conexión Socket.IO
- typing_status se actualiza via eventos WebSocket
- Los mensajes se envían via WebSocket y se guardan en BD

PERMISOS:
- Profesores pueden chatear con sus alumnos (context_type = 'class')
- Creadores pueden chatear con jugadores de sus bloques (context_type = 'block')
- Chat general entre cualquier usuario (context_type = 'general')
*/
