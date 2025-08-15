# 🕐 Sistema de Escalado Automático PLAYTEST

## Estado del Sistema

✅ **Escalado automático configurado y operativo**

### Funcionalidades Implementadas

1. **Scheduler Automático**
   - ⏰ Ejecuta cada hora automáticamente
   - 🕐 Horario: Minuto 0 de cada hora (00:00, 01:00, 02:00...)
   - 🌍 Zona horaria: Europe/Madrid
   - 🔄 Auto-reinicio con el servidor

2. **API de Gestión**
   - `GET /api/communication/escalation/status` - Ver estado del scheduler
   - `POST /api/communication/escalation/manual` - Ejecutar escalado manual
   - 🔒 Solo accesible para administradores

3. **Logs y Monitoreo**
   - 📝 Logs detallados en consola del servidor
   - ⏱️ Timestamps con zona horaria europea
   - 📊 Contador de tickets escalados por ejecución

## Configuración Técnica

### Archivos del Sistema
```
playtest-backend/
├── escalation-cron.js     # Script de escalado standalone
├── setup-cron.js          # Clase scheduler con node-cron
└── server.js              # Integración en servidor principal
```

### Lógica de Escalado

1. **Condiciones para Escalado**
   - Tickets con `escalate_at <= NOW()`
   - Status: 'abierto' o 'en_progreso'
   - No escalados previamente (`escalated_to IS NULL`)

2. **Proceso de Escalado**
   - Buscar admin asignado del usuario actual
   - Si no existe, escalar al AdminPrincipal
   - Actualizar `escalated_to` y `escalate_at` (+24h)
   - Crear notificación para el admin escalado

### Horarios de Ejecución

```
Frecuencia: Cada hora
Horario: 0 * * * * (cron format)
Ejemplos de ejecución:
- 08:00:00 AM
- 09:00:00 AM  
- 10:00:00 AM
- ... etc
```

## Gestión y Monitoreo

### 1. Estado del Scheduler
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/communication/escalation/status
```

**Respuesta esperada:**
```json
{
  "isRunning": true,
  "schedule": "0 * * * * (every hour)",
  "timezone": "Europe/Madrid",
  "nextRun": "Every hour at minute 0"
}
```

### 2. Escalado Manual
```bash
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/communication/escalation/manual
```

**Respuesta esperada:**
```json
{
  "message": "Escalado manual completado - 3 tickets escalados",
  "escalatedCount": 3
}
```

### 3. Logs del Servidor

**Inicio del scheduler:**
```
✅ Escalation scheduler started - running every hour
   Next run: Every hour at minute 0
   Timezone: Europe/Madrid
```

**Ejecución automática:**
```
🕐 Scheduled escalation job starting...
🔄 [2025-08-15T18:00:00.000Z] Running ticket escalation check...
✅ [2025-08-15T18:00:01.234Z] Escalated 2 ticket(s)
```

**Sin tickets para escalar:**
```
🔄 [2025-08-15T19:00:00.000Z] Running ticket escalation check...
ℹ️  [2025-08-15T19:00:01.123Z] No tickets needed escalation
```

## Troubleshooting

### ❌ Scheduler no inicia
```bash
# Verificar dependencias
cd playtest-backend
npm list node-cron

# Revisar logs del servidor para errores
```

### ❌ Escalado no funciona
```bash
# Verificar función en BD
psql -d playtest -c "SELECT escalate_tickets();"

# Verificar tickets pendientes
psql -d playtest -c "
SELECT id, ticket_number, escalate_at 
FROM tickets 
WHERE escalate_at IS NOT NULL 
AND escalate_at <= NOW() 
AND status IN ('abierto', 'en_progreso');
"
```

### ❌ API endpoints no responden
```bash
# Verificar token de administrador
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/roles/my-roles

# Debería incluir 'administrador_principal' o 'administrador_secundario'
```

## Mantenimiento

### Ejecutar Escalado Manual
```bash
# Desde línea de comandos
cd playtest-backend
node escalation-cron.js

# Desde API (recomendado)
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/communication/escalation/manual
```

### Cambiar Frecuencia
Editar `setup-cron.js` línea del schedule:
```javascript
// Actual: cada hora
this.job = cron.schedule('0 * * * *', ...)

// Cada 30 minutos
this.job = cron.schedule('*/30 * * * *', ...)

// Cada 6 horas
this.job = cron.schedule('0 */6 * * *', ...)
```

### Backup de Logs
```bash
# Redirigir output del servidor a archivo
npm start > escalation.log 2>&1

# Filtrar solo logs de escalado
grep "escalation\|Escalated\|escalate" escalation.log
```

## Seguridad

- ✅ Solo administradores pueden gestionar escalado
- ✅ Tokens JWT requeridos para API endpoints
- ✅ Logs no exponen información sensible
- ✅ Timezone configurado para evitar confusiones

## Estados de Tickets

### Antes del Escalado
```sql
ticket_id: 123
assigned_to: 5 (Usuario normal)
escalated_to: NULL
escalate_at: 2025-08-15 16:00:00
status: 'abierto'
```

### Después del Escalado
```sql
ticket_id: 123
assigned_to: 5 (Usuario normal - sin cambios)
escalated_to: 2 (Admin asignado)
escalate_at: 2025-08-16 16:00:00 (+24h)
status: 'abierto'
```

### Notificación Generada
```sql
user_id: 2 (Admin escalado)
type: 'escalation'
title: 'Ticket escalado'
message: 'Se te ha escalado un ticket que requiere atención'
ticket_id: 123
```

---

## ✅ Sistema Completamente Operativo

El sistema de escalado automático está:
- 🟢 **Configurado** y funcionando
- 🟢 **Integrado** en el servidor principal
- 🟢 **Monitoreado** con APIs de gestión
- 🟢 **Documentado** para mantenimiento futuro

**Próximo escalado**: Se ejecutará automáticamente en el próximo minuto 0 de la hora actual.