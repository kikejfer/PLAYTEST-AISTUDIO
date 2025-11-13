# 🔧 Guía de Reparación - Base de Datos Render

## Problema

Los logs de Render muestran estos errores:

```
Error obteniendo conteo de no leídos: error: relation "direct_messages" does not exist
Error cleaning up expired typing status: error: function cleanup_expired_typing_status() does not exist
```

**Causa**: La migración del sistema de mensajería directa (`001-add-direct-messaging.sql`) no se ha aplicado en la base de datos de producción.

---

## Solución Rápida (Recomendada)

### Opción 1: Trigger automático con re-deploy

La solución más sencilla es hacer un re-deploy para que el script `init-render-db.js` se ejecute automáticamente:

1. Ve al Dashboard de Render
2. Selecciona el servicio `playtest-backend`
3. Haz clic en "Manual Deploy" → "Deploy latest commit"
4. Espera a que termine el deploy
5. Revisa los logs durante el proceso de `postbuild` para confirmar que se aplicó la migración

**El script `init-render-db.js` ahora detecta automáticamente si faltan las tablas/funciones y las crea.**

---

### Opción 2: Ejecutar script de reparación desde Render Shell

Si prefieres aplicar la migración sin hacer re-deploy:

1. Ve a Render Dashboard → `playtest-backend` → Shell
2. Ejecuta:

```bash
npm run fix-db
```

Este script:
- ✅ Diagnostica el estado de la base de datos
- ✅ Aplica la migración si hace falta
- ✅ Verifica que todo funcione correctamente
- ✅ Ejecuta tests de las queries críticas

---

### Opción 3: Aplicar migración manualmente con psql

Si las opciones anteriores fallan:

1. Ve a Render Shell
2. Ejecuta:

```bash
psql $DATABASE_URL < playtest-backend/migrations/001-add-direct-messaging.sql
```

---

## Verificación Post-Reparación

Después de aplicar cualquiera de las soluciones, verifica que los errores desaparezcan:

1. **En Render Logs**, busca:
   - ✅ Ya NO debe aparecer: `relation "direct_messages" does not exist`
   - ✅ Ya NO debe aparecer: `function cleanup_expired_typing_status() does not exist`

2. **En el frontend**, verifica:
   - ✅ El contador de mensajes no leídos funciona
   - ✅ No hay error 500 en `/api/messages/unread-count`

3. **Prueba el chat**:
   - ✅ Enviar mensajes directos funciona
   - ✅ Ver conversaciones funciona
   - ✅ El indicador de "escribiendo..." funciona

---

## Scripts Disponibles

| Script | Descripción | Cuándo usar |
|--------|-------------|-------------|
| `npm run init-db` | Inicializa la BD (se ejecuta automáticamente en deploy) | Automático en postbuild |
| `npm run fix-db` | Diagnostica y repara la BD | Manualmente cuando hay problemas |
| `node apply-direct-messaging-migration.js` | Aplica solo migración de mensajería | Testing local |

---

## Arquitectura de Migraciones

```
playtest-backend/
├── migrations/
│   └── 001-add-direct-messaging.sql   ← Migración del sistema de chat
├── init-render-db.js                   ← Se ejecuta automáticamente en deploy
├── fix-render-database.js              ← Script de reparación manual
└── apply-direct-messaging-migration.js ← Script legacy (usar fix-db en su lugar)
```

### ¿Cómo funciona?

1. **En cada deploy** (automático):
   - `npm run build` instala dependencias
   - `npm run postbuild` ejecuta `init-render-db.js`
   - `init-render-db.js` verifica si existen las tablas/funciones
   - Si faltan, aplica `001-add-direct-messaging.sql`

2. **Manualmente** (cuando hay problemas):
   - Ejecutar `npm run fix-db` desde Render Shell
   - El script diagnostica y repara automáticamente

---

## Tablas Creadas por la Migración

La migración `001-add-direct-messaging.sql` crea:

### Tablas principales:
- ✅ `conversations` - Conversaciones entre dos usuarios
- ✅ `direct_messages` - Mensajes individuales
- ✅ `typing_status` - Estado de "está escribiendo..."
- ✅ `user_online_status` - Estado online/offline de usuarios
- ✅ `conversation_settings` - Preferencias de notificación
- ✅ `message_attachments` - Archivos adjuntos (compartida con tickets)

### Funciones críticas:
- ✅ `cleanup_expired_typing_status()` - Limpia estados de typing expirados
- ✅ `get_or_create_conversation()` - Obtiene o crea conversación
- ✅ `mark_conversation_as_read()` - Marca mensajes como leídos
- ✅ `mark_message_as_read()` - Marca mensaje individual como leído
- ✅ `get_user_conversations()` - Obtiene lista de conversaciones
- ✅ `update_conversation_last_message()` - Trigger para actualizar timestamp
- ✅ `notify_direct_message()` - Trigger para crear notificaciones

### Vistas:
- ✅ `direct_messages_complete` - Mensajes con info completa de usuarios
- ✅ `unread_message_counts` - Contadores de no leídos por conversación

---

## Prevención de Problemas Futuros

### ✅ Qué hace este fix:

1. **Detección automática**: `init-render-db.js` ahora detecta si faltan tablas/funciones
2. **Aplicación inteligente**: Solo aplica la migración si es necesario
3. **No falla el deploy**: Si hay errores en producción, no detiene el deploy
4. **Logs claros**: Muestra exactamente qué se creó o qué ya existía

### ✅ Nuevas migraciones:

Cuando agregues nuevas migraciones:

1. Crea el archivo en `migrations/XXX-nombre-descriptivo.sql`
2. Actualiza `init-render-db.js` para detectar y aplicar la nueva migración
3. Haz commit y push
4. Render aplicará la migración automáticamente en el próximo deploy

---

## Troubleshooting

### ❌ "Cannot read property 'rows' of undefined"

**Causa**: El query falló porque la tabla no existe.

**Solución**: Ejecuta `npm run fix-db`

---

### ❌ "Migration already applied but errors persist"

**Causa**: La migración se aplicó parcialmente.

**Solución**:
1. Ejecuta `npm run fix-db` (detecta qué falta y lo crea)
2. Si persiste, aplica manualmente:
   ```bash
   psql $DATABASE_URL < playtest-backend/migrations/001-add-direct-messaging.sql
   ```

---

### ❌ "Permission denied to create table"

**Causa**: El usuario de la BD no tiene permisos.

**Solución**:
1. Verifica que `DATABASE_URL` usa el usuario correcto
2. Otorga permisos desde el panel de Render Database
3. Contacta soporte de Render si es necesario

---

## Contacto

Si después de seguir esta guía el problema persiste:

1. Copia los logs completos de Render
2. Ejecuta `npm run fix-db` y copia la salida
3. Reporta el issue con los logs

---

**Última actualización**: 2025-01-13
**Versión del fix**: 1.0.0
