# Errores del Backend - Análisis y Soluciones

## 🔴 Errores Críticos: Tablas y Funciones Faltantes en PostgreSQL

### Errores Detectados en Logs de Render:

```
1. Error: function cleanup_expired_typing_status() does not exist
   Ubicación: playtest-backend/websocket/messaging-handler.js:484

2. Error: relation "direct_messages" does not exist
   Ubicación: playtest-backend/routes/direct-messaging.js:618
```

**Sistema Afectado:** Mensajería Directa (WebSocket) 💬
**Tipo:** ERROR de PostgreSQL
**Severidad:** CRÍTICO - Impide funcionamiento completo del sistema

---

## 📋 Análisis Completo

### Error 1: Función Faltante
```sql
cleanup_expired_typing_status()
```
**Propósito:** Limpiar estados de "escribiendo..." expirados
**Requiere:** Tabla `typing_status`

### Error 2: Tabla Faltante
```sql
direct_messages
```
**Propósito:** Almacenar mensajes directos entre usuarios
**Causa del error 500:** `/api/messages/unread-count`
**Ubicación:** `routes/direct-messaging.js:618`

---

## ✅ SOLUCIÓN COMPLETA

### Script SQL Completo para Render PostgreSQL

Conectarse a la base de datos de Render y ejecutar:

```sql
-- ============================================
-- SOLUCIÓN COMPLETA: Mensajería Directa
-- Fecha: 2025-11-13
-- ============================================

-- 1. Crear tabla de conversaciones (si no existe)
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

-- 3. Crear tabla de mensajes directos (FALTANTE - CRÍTICO)
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

-- 4. Crear tabla de estados de typing (para "escribiendo...")
CREATE TABLE IF NOT EXISTS typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- 5. Crear índices para mejorar performance
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

-- 6. Crear función de limpieza de typing status (FALTANTE - CRÍTICO)
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void AS $$
BEGIN
    -- Eliminar estados de typing más antiguos de 10 segundos
    DELETE FROM typing_status
    WHERE updated_at < NOW() - INTERVAL '10 seconds';

    -- Log opcional
    RAISE NOTICE 'Cleaned up expired typing statuses';
END;
$$ LANGUAGE plpgsql;

-- 7. Crear función para marcar mensajes como leídos
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

-- 8. Crear función para obtener conteo de no leídos
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

-- 9. Crear trigger para actualizar last_message_at
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

DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON direct_messages;
CREATE TRIGGER trg_update_conversation_timestamp
    AFTER INSERT ON direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas existen
SELECT
    tablename,
    CASE
        WHEN tablename = 'conversations' THEN '✅ Conversaciones'
        WHEN tablename = 'conversation_participants' THEN '✅ Participantes'
        WHEN tablename = 'direct_messages' THEN '✅ Mensajes (CRÍTICO)'
        WHEN tablename = 'typing_status' THEN '✅ Estados de typing'
    END as descripcion
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_participants', 'direct_messages', 'typing_status')
ORDER BY tablename;

-- Verificar que las funciones existen
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

-- Probar la función de cleanup
SELECT cleanup_expired_typing_status();

-- Mostrar estructura de direct_messages
\d direct_messages
```

---

## 🚀 Implementación en Render

### ⚡ Opción Rápida: Ejecutar el Script de Migración

**Archivo listo para usar:**
```
playtest-backend/migrations/001-create-direct-messaging-tables.sql
```

Este archivo contiene TODO lo necesario y es **idempotente** (se puede ejecutar múltiples veces sin problema).

### Opción A: Via Cliente SQL (Recomendado)

**Pasos:**

1. **Conectar a PostgreSQL de Render:**
   ```bash
   # En Render Dashboard → PostgreSQL → Connect → External Connection
   # Copiar la connection string
   ```

2. **Usar un cliente SQL:**
   - **TablePlus / pgAdmin / DBeaver:** Pegar connection string
   - **psql (terminal):**
     ```bash
     psql postgresql://usuario:password@host:port/database
     ```

3. **Ejecutar el archivo de migración:**
   ```sql
   \i playtest-backend/migrations/001-create-direct-messaging-tables.sql
   ```

   O copiar y pegar el contenido completo del archivo.

4. **Verificar resultado:**
   - Deberías ver mensajes "✅" indicando que todo se creó correctamente
   - El script automáticamente verifica tablas y funciones creadas

### Opción B: Via Render Console (Alternativa)

1. En Render Dashboard → PostgreSQL service
2. Click en "Shell" (si está disponible)
3. Copiar y pegar el contenido de `001-create-direct-messaging-tables.sql`
4. Ejecutar

---

## 🔍 Diagnóstico de Errores Específicos

### ✅ Error RESUELTO: `/api/messages/unread-count`
**Error:** `relation "direct_messages" does not exist`
**Causa:** Tabla `direct_messages` faltante
**Solución:** ✅ Ejecutar script de migración (crea la tabla)

### ⚠️ Error Pendiente: `/api/students/my-classes`
**Error:** 500 Internal Server Error
**Sistema:** Panel de Estudiantes
**Causa:** Endpoint no implementado o error en query
**Solución:** Requiere revisión de backend (independiente de mensajería)

### ⚠️ Error Pendiente: `/api/communication/tickets?originType=block`
**Error:** 500 Internal Server Error
**Sistema:** Mensajes de Bloques 📝
**Posible Causa:**
- Error al procesar query parameter `originType`
- Tabla `tickets` sin datos o estructura incorrecta
- Trigger de asignación con error

**Query para diagnosticar:**
```sql
-- Verificar tickets de tipo block
SELECT * FROM tickets WHERE origin_type = 'block' LIMIT 10;

-- Verificar estructura de la tabla
\d tickets

-- Ver distribución de tickets
SELECT
    origin_type,
    status,
    COUNT(*) as total
FROM tickets
GROUP BY origin_type, status
ORDER BY origin_type, status;

-- Ver si existen categorías para tipo 'block'
SELECT * FROM ticket_categories WHERE origin_type = 'block';
```

---

## 📊 Resumen de Estado (Actualizado)

| Componente | Estado Antes | Estado Después | Acción |
|------------|--------------|----------------|---------|
| Tabla `direct_messages` | ❌ Faltante | ✅ Script listo | Ejecutar migración |
| Tabla `typing_status` | ❌ Faltante | ✅ Script listo | Ejecutar migración |
| Función `cleanup_expired_typing_status()` | ❌ Faltante | ✅ Script listo | Ejecutar migración |
| Función `get_unread_count()` | ❌ Faltante | ✅ Script listo | Ejecutar migración |
| Error `/messages/unread-count` | ❌ 500 | ✅ Se resolverá | Ejecutar migración |
| Error typing cleanup | ❌ Logs error | ✅ Se resolverá | Ejecutar migración |
| Mensajería Directa 💬 | ⚠️ Parcial | ✅ Funcionará | Ejecutar migración |
| Mensajes de Bloques 📝 | ⚠️ 500 Error | ⚠️ Requiere análisis | Revisar backend |
| Panel Estudiantes | ⚠️ 500 Error | ⚠️ Independiente | Revisar backend |

---

## 🎯 Prioridades (Actualizadas)

### 1. **CRÍTICO - Ejecutar AHORA:**
   - ✅ Ejecutar `001-create-direct-messaging-tables.sql` en PostgreSQL
   - ✅ Verificar que las 4 tablas se crearon
   - ✅ Verificar que las 4 funciones se crearon
   - ✅ Reiniciar backend en Render (opcional, para limpiar cache)

### 2. **Alta Prioridad:**
   - ⚠️ Investigar error 500 en `/api/communication/tickets?originType=block`
   - ⚠️ Verificar que existan categorías para tickets de tipo 'block'
   - ⚠️ Probar crear un ticket de bloque desde el frontend

### 3. **Media Prioridad:**
   - 💡 Revisar error 500 en `/api/students/my-classes` (si afecta funcionalidad importante)

---

## 📝 Notas

- Los cambios en el frontend (tickets-list.html, block-messaging.html) ya están hechos ✅
- El sistema de mensajería de bloques está funcionalmente completo ✅
- Los errores 500 son **exclusivamente del backend** y requieren acceso a Render
- La función de cleanup es para el sistema de mensajería directa (no afecta mensajes de bloques)

---

**Fecha:** 2025-11-13
**Responsable Backend:** Requiere acceso a PostgreSQL de Render
**Archivos a Modificar:** Base de datos (SQL)
