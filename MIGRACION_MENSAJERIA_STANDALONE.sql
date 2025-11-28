-- Migración: Sistema de Mensajería Directa (VERSIÓN STANDALONE)
-- Fecha: 2025-01-06
-- Descripción: Versión independiente que NO requiere el sistema de tickets
-- Esta versión crea su propia tabla de notificaciones si no existe

BEGIN;

-- ============================================================================
-- PASO 1: Crear tabla de conversaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    context_type VARCHAR(20) NOT NULL,
    context_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_archived_by_user1 BOOLEAN DEFAULT false,
    is_archived_by_user2 BOOLEAN DEFAULT false
);

-- Crear índice único para prevenir conversaciones duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique
ON conversations (
    LEAST(user1_id, user2_id),
    GREATEST(user1_id, user2_id),
    context_type,
    COALESCE(context_id, 0)
);

-- ============================================================================
-- PASO 2: Crear tabla de mensajes directos
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    message_html TEXT,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- PASO 3: Crear tabla de adjuntos
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER, -- Para compatibilidad con sistema de tickets (opcional)
    message_id INTEGER, -- Para compatibilidad con sistema de tickets (opcional)
    direct_message_id INTEGER REFERENCES direct_messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_image BOOLEAN DEFAULT false,
    thumbnail_path VARCHAR(500)
);

-- ============================================================================
-- PASO 4: Crear tabla de estado de escritura
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    is_typing BOOLEAN DEFAULT true,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 seconds'),
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- PASO 5: Crear tabla de estado online
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_online_status (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    socket_id VARCHAR(100),
    connected_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PASO 6: Crear tabla de configuración de conversaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_settings (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- PASO 7: Crear tabla de notificaciones (si no existe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ticket_id INTEGER, -- Para compatibilidad con sistema de tickets (opcional)
    direct_message_id INTEGER REFERENCES direct_messages(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Si la tabla notifications ya existía, agregar columnas faltantes
DO $$
BEGIN
    -- Agregar direct_message_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'direct_message_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN direct_message_id INTEGER REFERENCES direct_messages(id) ON DELETE CASCADE;
        RAISE NOTICE 'Columna direct_message_id agregada a notifications';
    END IF;

    -- Agregar metadata si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Columna metadata agregada a notifications';
    END IF;
END $$;

-- ============================================================================
-- PASO 8: Crear funciones
-- ============================================================================

-- Función: Actualizar last_message_at en conversación
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON direct_messages;
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
    -- Obtener configuración de notificaciones
    SELECT cs.notifications_enabled, cs.is_muted
    INTO settings_record
    FROM conversation_settings cs
    WHERE cs.conversation_id = NEW.conversation_id
    AND cs.user_id = NEW.recipient_id;

    -- Si no hay configuración, asumir que quiere notificaciones
    IF settings_record IS NULL THEN
        settings_record.notifications_enabled := true;
        settings_record.is_muted := false;
    END IF;

    -- Solo crear notificación si está habilitada
    IF settings_record.notifications_enabled AND NOT settings_record.is_muted THEN
        SELECT nickname INTO sender_name FROM users WHERE id = NEW.sender_id;

        INSERT INTO notifications (
            user_id, type, title, message, action_url, metadata, direct_message_id
        ) VALUES (
            NEW.recipient_id,
            'direct_message',
            'Nuevo mensaje de ' || COALESCE(sender_name, 'Usuario'),
            LEFT(NEW.message_text, 100),
            '/chat/' || NEW.conversation_id,
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id,
                'message_id', NEW.id
            ),
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_direct_message ON direct_messages;
CREATE TRIGGER trigger_notify_direct_message
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    WHEN (NEW.message_type = 'text')
    EXECUTE FUNCTION notify_direct_message();

-- Función: Marcar mensaje como leído
CREATE OR REPLACE FUNCTION mark_message_as_read(p_message_id INTEGER, p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    SELECT * INTO message_record FROM direct_messages
    WHERE id = p_message_id AND recipient_id = p_user_id;

    IF NOT FOUND THEN RETURN false; END IF;

    UPDATE direct_messages
    SET is_read = true, read_at = NOW()
    WHERE id = p_message_id AND is_read = false;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Función: Marcar todos los mensajes de una conversación como leídos
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id INTEGER, p_user_id INTEGER)
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

-- Función: Obtener conversaciones de un usuario
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
        c.id,
        CASE WHEN c.user1_id = p_user_id THEN c.user2_id ELSE c.user1_id END,
        CASE WHEN c.user1_id = p_user_id THEN u2.nickname ELSE u1.nickname END,
        CASE WHEN c.user1_id = p_user_id THEN u2.avatar_url ELSE u1.avatar_url END,
        c.context_type::VARCHAR,
        c.context_id,
        (SELECT dm.message_text FROM direct_messages dm
         WHERE dm.conversation_id = c.id AND dm.deleted_at IS NULL
         ORDER BY dm.created_at DESC LIMIT 1),
        c.last_message_at,
        (SELECT dm.sender_id FROM direct_messages dm
         WHERE dm.conversation_id = c.id AND dm.deleted_at IS NULL
         ORDER BY dm.created_at DESC LIMIT 1),
        (SELECT COUNT(*) FROM direct_messages dm
         WHERE dm.conversation_id = c.id AND dm.recipient_id = p_user_id
         AND dm.is_read = false AND dm.deleted_at IS NULL),
        CASE WHEN c.user1_id = p_user_id THEN c.is_archived_by_user1 ELSE c.is_archived_by_user2 END,
        COALESCE(cs.is_pinned, false),
        COALESCE(cs.is_muted, false)
    FROM conversations c
    LEFT JOIN users u1 ON c.user1_id = u1.id
    LEFT JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN conversation_settings cs ON cs.conversation_id = c.id AND cs.user_id = p_user_id
    WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
    AND c.is_active = true
    AND ((c.user1_id = p_user_id AND c.is_archived_by_user1 = false) OR
         (c.user2_id = p_user_id AND c.is_archived_by_user2 = false))
    ORDER BY COALESCE(cs.is_pinned, false) DESC, c.last_message_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener o crear conversación
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
    min_user_id := LEAST(p_user1_id, p_user2_id);
    max_user_id := GREATEST(p_user1_id, p_user2_id);

    SELECT id INTO conversation_id FROM conversations
    WHERE user1_id = min_user_id AND user2_id = max_user_id
    AND context_type = p_context_type AND COALESCE(context_id, 0) = COALESCE(p_context_id, 0);

    IF conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id, context_type, context_id)
        VALUES (min_user_id, max_user_id, p_context_type, p_context_id)
        RETURNING id INTO conversation_id;
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Limpiar estados de typing expirados
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM typing_status WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 9: Crear índices
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_attachments_direct_message ON message_attachments(direct_message_id);

CREATE INDEX IF NOT EXISTS idx_typing_status_conversation ON typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_expires ON typing_status(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_online_status_online ON user_online_status(is_online, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_settings_user ON conversation_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_settings_pinned ON conversation_settings(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- PASO 10: Crear vistas
-- ============================================================================

CREATE OR REPLACE VIEW direct_messages_complete AS
SELECT
    dm.id, dm.conversation_id, dm.message_text, dm.message_html,
    dm.is_read, dm.read_at, dm.is_edited, dm.edited_at,
    dm.message_type, dm.created_at,
    sender.id as sender_id, sender.nickname as sender_nickname, sender.avatar_url as sender_avatar,
    recipient.id as recipient_id, recipient.nickname as recipient_nickname, recipient.avatar_url as recipient_avatar,
    (SELECT COUNT(*) FROM message_attachments ma WHERE ma.direct_message_id = dm.id) as attachment_count
FROM direct_messages dm
LEFT JOIN users sender ON dm.sender_id = sender.id
LEFT JOIN users recipient ON dm.recipient_id = recipient.id
WHERE dm.deleted_at IS NULL;

CREATE OR REPLACE VIEW unread_message_counts AS
SELECT
    dm.recipient_id as user_id,
    dm.conversation_id,
    COUNT(*) as unread_count,
    MAX(dm.created_at) as latest_unread_at
FROM direct_messages dm
WHERE dm.is_read = false AND dm.deleted_at IS NULL
GROUP BY dm.recipient_id, dm.conversation_id;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

DO $$
DECLARE
    missing_tables TEXT[];
    table_count INTEGER;
BEGIN
    SELECT ARRAY_AGG(table_name)
    INTO missing_tables
    FROM (VALUES
        ('conversations'),
        ('direct_messages'),
        ('message_attachments'),
        ('typing_status'),
        ('user_online_status'),
        ('conversation_settings'),
        ('notifications')
    ) AS expected(table_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = expected.table_name AND table_schema = 'public'
    );

    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Migración fallida. Tablas faltantes: %', missing_tables;
    ELSE
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables
        WHERE table_name IN (
            'conversations',
            'direct_messages',
            'message_attachments',
            'typing_status',
            'user_online_status',
            'conversation_settings',
            'notifications'
        );

        RAISE NOTICE '';
        RAISE NOTICE '✅ ============================================';
        RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
        RAISE NOTICE '✅ ============================================';
        RAISE NOTICE '';
        RAISE NOTICE '📊 Tablas creadas/verificadas: %', table_count;
        RAISE NOTICE '📊 Funciones creadas: 7';
        RAISE NOTICE '📊 Vistas creadas: 2';
        RAISE NOTICE '📊 Triggers creados: 2';
        RAISE NOTICE '';
        RAISE NOTICE '🎉 El sistema de mensajería está listo para usar';
        RAISE NOTICE '';
    END IF;
END $$;
