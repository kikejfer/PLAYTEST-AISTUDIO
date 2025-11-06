# 🚀 Guía de Instalación - Sistema de Mensajería Directa

## Paso 1: Ejecutar Migración en pgAdmin4

### Instrucciones:

1. **Abre pgAdmin4** y conéctate a tu base de datos de Aiven

2. **Selecciona tu base de datos** (playtest o el nombre que uses)

3. **Abre Query Tool**
   - Click derecho en la base de datos → "Query Tool"
   - O usa el atajo: `Alt + Shift + Q`

4. **Carga el archivo SQL**
   - Click en el icono de carpeta 📁 "Open File"
   - Navega a: `playtest-backend/migrations/001-add-direct-messaging.sql`
   - Selecciona el archivo

5. **Ejecuta la migración**
   - Click en el botón "Execute/Refresh" ▶️
   - O usa F5
   - **Tiempo estimado:** 5-10 segundos

6. **Verifica que no haya errores**
   - En el panel inferior deberías ver:
     ```
     NOTICE:  Migración completada exitosamente. Todas las tablas fueron creadas.
     Query returned successfully in X msec.
     ```

---

## Paso 2: Verificar la Instalación

### Opción A: Ejecutar Script de Verificación SQL

1. **Abre nuevo Query Tool** (Alt + Shift + Q)

2. **Copia y pega** el siguiente script de verificación:

```sql
-- SCRIPT DE VERIFICACIÓN - Sistema de Mensajería Directa
-- Este script verifica que todas las tablas y funciones se crearon correctamente

SELECT '============================================================' as info
UNION ALL SELECT '  VERIFICACIÓN: Sistema de Mensajería Directa'
UNION ALL SELECT '============================================================';

-- ============================================================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================================================

SELECT '
📊 TABLAS CREADAS:' as info;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN '✅'
        ELSE '❌'
    END || ' conversations' as tabla
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') THEN '✅'
        ELSE '❌'
    END || ' direct_messages'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_attachments') THEN '✅'
        ELSE '❌'
    END || ' message_attachments'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_status') THEN '✅'
        ELSE '❌'
    END || ' typing_status'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_online_status') THEN '✅'
        ELSE '❌'
    END || ' user_online_status'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_settings') THEN '✅'
        ELSE '❌'
    END || ' conversation_settings';

-- ============================================================================
-- 2. VERIFICAR FUNCIONES CREADAS
-- ============================================================================

SELECT '
🔧 FUNCIONES CREADAS:' as info;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_conversation_last_message') THEN '✅'
        ELSE '❌'
    END || ' update_conversation_last_message()' as funcion
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_direct_message') THEN '✅'
        ELSE '❌'
    END || ' notify_direct_message()'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_message_as_read') THEN '✅'
        ELSE '❌'
    END || ' mark_message_as_read()'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_conversation_as_read') THEN '✅'
        ELSE '❌'
    END || ' mark_conversation_as_read()'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_conversations') THEN '✅'
        ELSE '❌'
    END || ' get_user_conversations()'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_conversation') THEN '✅'
        ELSE '❌'
    END || ' get_or_create_conversation()'
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_typing_status') THEN '✅'
        ELSE '❌'
    END || ' cleanup_expired_typing_status()';

-- ============================================================================
-- 3. VERIFICAR ÍNDICES CREADOS
-- ============================================================================

SELECT '
📇 ÍNDICES CREADOS:' as info;

SELECT
    tablename || ': ' || COUNT(*)::text || ' índices' as indices
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'conversations',
    'direct_messages',
    'message_attachments',
    'typing_status',
    'user_online_status',
    'conversation_settings'
)
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. VERIFICAR VISTAS CREADAS
-- ============================================================================

SELECT '
👁️ VISTAS CREADAS:' as info;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'direct_messages_complete') THEN '✅'
        ELSE '❌'
    END || ' direct_messages_complete' as vista
UNION ALL
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'unread_message_counts') THEN '✅'
        ELSE '❌'
    END || ' unread_message_counts';

-- ============================================================================
-- 5. ESTADÍSTICAS DE DATOS
-- ============================================================================

SELECT '
📊 ESTADÍSTICAS ACTUALES:' as info;

SELECT 'conversations: ' || COUNT(*)::text || ' registros' as estadistica FROM conversations
UNION ALL
SELECT 'direct_messages: ' || COUNT(*)::text || ' registros' FROM direct_messages
UNION ALL
SELECT 'message_attachments: ' || COUNT(*)::text || ' registros' FROM message_attachments
UNION ALL
SELECT 'typing_status: ' || COUNT(*)::text || ' registros' FROM typing_status
UNION ALL
SELECT 'user_online_status: ' || COUNT(*)::text || ' registros' FROM user_online_status
UNION ALL
SELECT 'conversation_settings: ' || COUNT(*)::text || ' registros' FROM conversation_settings;

-- ============================================================================
-- 6. RESULTADO FINAL
-- ============================================================================

SELECT '
============================================================' as info
UNION ALL
SELECT CASE
    WHEN (
        SELECT COUNT(*) = 6
        FROM information_schema.tables
        WHERE table_name IN (
            'conversations',
            'direct_messages',
            'message_attachments',
            'typing_status',
            'user_online_status',
            'conversation_settings'
        )
    )
    AND (
        SELECT COUNT(*) = 7
        FROM pg_proc
        WHERE proname IN (
            'update_conversation_last_message',
            'notify_direct_message',
            'mark_message_as_read',
            'mark_conversation_as_read',
            'get_user_conversations',
            'get_or_create_conversation',
            'cleanup_expired_typing_status'
        )
    )
    THEN '  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE'
    ELSE '  ⚠️ MIGRACIÓN INCOMPLETA - Revisar errores'
END
UNION ALL
SELECT '============================================================';
```

3. **Ejecuta el script** (F5)

4. **Verifica los resultados**:
   - Todas las tablas deben tener ✅
   - Todas las funciones deben tener ✅
   - Todas las vistas deben tener ✅
   - El resultado final debe decir: **"✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"**

---

### Opción B: Verificar Manualmente

En pgAdmin4, expande el árbol de la izquierda:

```
Databases
└── [tu-base-de-datos]
    ├── Schemas
    │   └── public
    │       ├── Tables
    │       │   ├── conversations ✅
    │       │   ├── conversation_settings ✅
    │       │   ├── direct_messages ✅
    │       │   ├── message_attachments ✅
    │       │   ├── typing_status ✅
    │       │   └── user_online_status ✅
    │       ├── Functions
    │       │   ├── cleanup_expired_typing_status() ✅
    │       │   ├── get_or_create_conversation() ✅
    │       │   ├── get_user_conversations() ✅
    │       │   ├── mark_conversation_as_read() ✅
    │       │   ├── mark_message_as_read() ✅
    │       │   ├── notify_direct_message() ✅
    │       │   └── update_conversation_last_message() ✅
    │       └── Views
    │           ├── direct_messages_complete ✅
    │           └── unread_message_counts ✅
```

---

## Paso 3: Insertar Datos de Prueba (Opcional)

Si quieres probar con datos de ejemplo, ejecuta este script:

```sql
-- DATOS DE PRUEBA - Sistema de Mensajería Directa

-- 1. Crear conversación de prueba (reemplaza user1_id y user2_id con IDs reales de tu BD)
INSERT INTO conversations (user1_id, user2_id, context_type)
VALUES (1, 2, 'general')
ON CONFLICT DO NOTHING
RETURNING id;

-- 2. Insertar mensajes de prueba
DO $$
DECLARE
    conv_id INTEGER;
BEGIN
    -- Obtener ID de conversación
    SELECT id INTO conv_id FROM conversations WHERE user1_id = 1 AND user2_id = 2 LIMIT 1;

    IF conv_id IS NOT NULL THEN
        -- Mensaje 1
        INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, message_text)
        VALUES (conv_id, 1, 2, '¡Hola! ¿Cómo estás?');

        -- Mensaje 2
        INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, message_text)
        VALUES (conv_id, 2, 1, '¡Hola! Todo bien, ¿y tú?');

        -- Mensaje 3
        INSERT INTO direct_messages (conversation_id, sender_id, recipient_id, message_text)
        VALUES (conv_id, 1, 2, 'Excelente! Este es el nuevo sistema de mensajería 🚀');

        RAISE NOTICE 'Datos de prueba insertados exitosamente';
    ELSE
        RAISE NOTICE 'No se encontró la conversación. Crea primero usuarios con IDs 1 y 2';
    END IF;
END $$;
```

---

## ✅ Checklist de Instalación

- [ ] Migración ejecutada sin errores
- [ ] 6 tablas creadas
- [ ] 7 funciones creadas
- [ ] 2 vistas creadas
- [ ] Índices creados automáticamente
- [ ] Script de verificación ejecutado
- [ ] Resultado: "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"
- [ ] (Opcional) Datos de prueba insertados

---

## 🔧 Solución de Problemas

### Error: "relation users does not exist"
**Solución:** La tabla `users` debe existir previamente. Verifica que la base de datos principal esté configurada.

### Error: "column notifications.metadata does not exist"
**Solución:** La migración agrega esta columna automáticamente. Si falla, ejecuta:
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

### Error: "constraint unique_conversation already exists"
**Solución:** Las tablas ya existen. Puedes saltarte la migración o eliminar las tablas primero:
```sql
DROP TABLE IF EXISTS conversation_settings CASCADE;
DROP TABLE IF EXISTS typing_status CASCADE;
DROP TABLE IF EXISTS user_online_status CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
-- Luego ejecuta la migración de nuevo
```

---

## 📞 Siguiente Paso

Una vez completada la migración, notifícame y continuaremos con:
1. Iniciar el servidor backend
2. Probar los endpoints de API
3. Probar el chat en el frontend

¡Avísame cuando hayas terminado!
