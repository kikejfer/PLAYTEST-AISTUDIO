-- ============================================
-- MIGRACIÓN: Tablas de Mensajería Directa
-- Fecha: 2025-11-13
-- Autor: Sistema
-- Propósito: Crear todas las tablas y funciones necesarias
--           para el sistema de mensajería directa
-- ============================================

-- NOTA: Este script es IDEMPOTENTE (se puede ejecutar múltiples veces)
-- Usa CREATE ... IF NOT EXISTS para seguridad

-- ============================================
-- TABLAS
-- ============================================

-- 1. Crear tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP
);

-- 2. Crear tabla de participantes en conversaciones
CREATE TABLE IF NOT EXISTS conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- 3. Crear tabla de mensajes directos (CRÍTICO - FALTANTE)
CREATE TABLE IF NOT EXISTS direct_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 4. Crear tabla de estados de typing
CREATE TABLE IF NOT EXISTS typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- ============================================
-- ÍNDICES (Para mejorar performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation
    ON direct_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender
    ON direct_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_created
    ON direct_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_read
    ON direct_messages(is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_typing_status_updated_at
    ON typing_status(updated_at);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
    ON conversation_participants(user_id);

-- ============================================
-- FUNCIONES
-- ============================================

-- 1. Función de limpieza de typing status (CRÍTICO - FALTANTE)
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_status
    WHERE updated_at < NOW() - INTERVAL '10 seconds';

    RAISE NOTICE 'Cleaned up expired typing statuses';
END;
$$ LANGUAGE plpgsql;

-- 2. Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id INTEGER,
    p_user_id INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE direct_messages
    SET is_read = TRUE,
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_read = FALSE;

    UPDATE conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para obtener conteo de no leídos
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id INTEGER)
RETURNS TABLE(conversation_id INTEGER, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.conversation_id,
        COUNT(*)::BIGINT as unread_count
    FROM direct_messages dm
    INNER JOIN conversation_participants cp
        ON dm.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
      AND dm.sender_id != p_user_id
      AND dm.is_read = FALSE
      AND dm.deleted_at IS NULL
    GROUP BY dm.conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para actualizar timestamp de conversación
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON direct_messages;
CREATE TRIGGER trg_update_conversation_timestamp
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Verificando tablas creadas...';
END $$;

-- Mostrar tablas creadas
SELECT
    tablename,
    CASE
        WHEN tablename = 'conversations' THEN '✅ Conversaciones'
        WHEN tablename = 'conversation_participants' THEN '✅ Participantes'
        WHEN tablename = 'direct_messages' THEN '✅ Mensajes directos (CRÍTICO)'
        WHEN tablename = 'typing_status' THEN '✅ Estados de typing'
    END as descripcion
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_participants', 'direct_messages', 'typing_status')
ORDER BY tablename;

-- Mostrar funciones creadas
SELECT
    proname as function_name,
    CASE
        WHEN proname = 'cleanup_expired_typing_status' THEN '✅ Limpieza typing (CRÍTICO)'
        WHEN proname = 'mark_messages_as_read' THEN '✅ Marcar leídos'
        WHEN proname = 'get_unread_count' THEN '✅ Contador no leídos'
        WHEN proname = 'update_conversation_timestamp' THEN '✅ Actualizar timestamp'
    END as descripcion
FROM pg_proc
WHERE proname IN (
    'cleanup_expired_typing_status',
    'mark_messages_as_read',
    'get_unread_count',
    'update_conversation_timestamp'
)
ORDER BY proname;

-- Probar función de cleanup
SELECT cleanup_expired_typing_status();

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'VERIFICACIÓN COMPLETADA';
    RAISE NOTICE 'Si ve las 4 tablas y 4 funciones arriba, está todo OK';
    RAISE NOTICE '================================================';
END $$;
