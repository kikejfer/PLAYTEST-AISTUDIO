# Errores del Backend - Análisis y Soluciones

## 🔴 Error Crítico: Función de Base de Datos Faltante

### Error Detectado:
```
Error cleaning up expired typing status: error: function cleanup_expired_typing_status() does not exist
```

**Ubicación:** `playtest-backend/websocket/messaging-handler.js:484`
**Sistema Afectado:** Mensajería Directa (WebSocket)
**Tipo:** ERROR de PostgreSQL
**Severidad:** ERROR

---

## 📋 Análisis del Problema

### Causa Raíz:
El backend intenta ejecutar una función de PostgreSQL que no existe en la base de datos:
```sql
cleanup_expired_typing_status()
```

### ¿Qué hace esta función?
Según el código en `messaging-handler.js:484`, esta función debería:
- Limpiar estados de "escribiendo..." expirados
- Ejecutarse periódicamente mediante `node-cron`
- Mantener limpia la tabla de estados de typing

### Archivo Afectado:
```javascript
// playtest-backend/websocket/messaging-handler.js:484
async function cleanupExpiredTypingStatus() {
    try {
        await pool.query('SELECT cleanup_expired_typing_status()');
        // ❌ Esta función NO EXISTE en la base de datos
    } catch (error) {
        console.error('Error cleaning up expired typing status:', error);
    }
}
```

---

## 🔧 Solución

### Paso 1: Crear la Función en PostgreSQL

Conectarse a la base de datos de Render y ejecutar:

```sql
-- Crear función para limpiar estados de typing expirados
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
```

**Nota:** Ajustar el intervalo (10 segundos) según necesidades.

### Paso 2: Verificar la Tabla

Asegurarse de que existe la tabla `typing_status`:

```sql
-- Verificar si existe
SELECT * FROM typing_status LIMIT 5;

-- Si no existe, crearla
CREATE TABLE IF NOT EXISTS typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- Índice para mejorar performance de cleanup
CREATE INDEX IF NOT EXISTS idx_typing_status_updated_at
ON typing_status(updated_at);
```

### Paso 3: Probar la Función

```sql
-- Ejecutar manualmente
SELECT cleanup_expired_typing_status();

-- Verificar que no da error
-- Debería retornar: cleanup_expired_typing_status
--                   --------------------------
--                   (1 row)
```

---

## 🚀 Implementación en Render

### Opción A: Via SQL Editor (Recomendado)

1. Ir a Render Dashboard
2. Seleccionar el servicio PostgreSQL
3. Click en "Connect" → "External Connection"
4. Usar un cliente SQL (TablePlus, pgAdmin, psql)
5. Ejecutar los scripts SQL de arriba

### Opción B: Via Migration Script

Crear archivo: `playtest-backend/migrations/add-typing-cleanup-function.sql`

```sql
-- Migration: Add cleanup function for typing status
-- Date: 2025-11-13

CREATE TABLE IF NOT EXISTS typing_status (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_status_updated_at
ON typing_status(updated_at);

CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_status
    WHERE updated_at < NOW() - INTERVAL '10 seconds';

    RAISE NOTICE 'Cleaned up expired typing statuses';
END;
$$ LANGUAGE plpgsql;
```

Luego ejecutar la migración en Render.

---

## 🔍 Otros Errores Relacionados

### Error 500 en `/api/messages/unread-count`
**Sistema:** Mensajería Directa
**Posible Causa:** Tabla o endpoint no implementado
**Solución:** Revisar logs del backend para error específico

### Error 500 en `/api/students/my-classes`
**Sistema:** Panel de Estudiantes
**Posible Causa:** Endpoint no implementado o error en query
**Solución:** Revisar logs del backend

### Error 500 en `/api/communication/tickets?originType=block`
**Sistema:** Mensajes de Bloques
**Posible Causa:**
- Error al procesar query parameter `originType`
- Tabla `tickets` sin datos
- Trigger de asignación con error

**Query para diagnosticar:**
```sql
-- Verificar tickets de tipo block
SELECT * FROM tickets WHERE origin_type = 'block' LIMIT 10;

-- Verificar estructura
\d tickets

-- Ver si hay tickets
SELECT COUNT(*) as total, origin_type FROM tickets GROUP BY origin_type;
```

---

## 📊 Resumen de Estado

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Función PostgreSQL | ❌ Falta | Crear en BD |
| Tabla typing_status | ❓ Verificar | Crear si no existe |
| WebSocket Handler | ⚠️ Error | Funciona pero con error |
| Mensajería Directa | ⚠️ Parcial | Depende de la función |
| Mensajes de Bloques | ✅ Frontend OK | Backend a revisar |
| Sistema de Tickets | ✅ Frontend OK | Backend a revisar |

---

## 🎯 Prioridades

1. **Alta Prioridad:**
   - ✅ Crear función `cleanup_expired_typing_status()`
   - ✅ Verificar/crear tabla `typing_status`

2. **Media Prioridad:**
   - ⚠️ Investigar error 500 en `/api/communication/tickets?originType=block`
   - ⚠️ Revisar implementación de `/api/messages/unread-count`

3. **Baja Prioridad:**
   - 💡 Revisar `/api/students/my-classes` (depende de uso)

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
