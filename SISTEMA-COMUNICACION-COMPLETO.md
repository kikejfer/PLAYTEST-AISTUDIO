# Sistema de Comunicación Interno Completo - PLAYTEST

## Descripción General

Sistema de comunicación completo con tickets integrados, chat en tiempo real, asignación automática inteligente, y redirección entre formularios según el tipo de soporte requerido.

## Características Principales

### ✅ **Acceso Dual con Formulario Unificado**

#### 1. Soporte Técnico Global
- **Ubicación**: Botón siempre visible en navegación
- **Destinatario**: Servicio Técnico automáticamente
- **Categorías**: Bug interfaz, rendimiento, login, luminarias, solicitudes
- **Redirección inteligente**: Detecta problemas de bloque específico

#### 2. Reporte por Bloque
- **Ubicación**: En cada bloque durante navegación/partida  
- **Destinatario**: Creador del bloque automáticamente
- **Categorías**: Preguntas incorrectas, contenido, sugerencias
- **Redirección inteligente**: Detecta problemas técnicos generales

### ✅ **Sistema de Tickets + Chat Integrado**

#### Estados del Ticket
- **Abierto** → **En progreso** → **Esperando respuesta** → **Resuelto** → **Cerrado**

#### Funcionalidades de Chat
- Chat en tiempo real con polling cada 3 segundos
- Soporte completo de adjuntos (imágenes, PDFs, documentos)
- Formateo de texto enriquecido (Markdown)
- Notas internas para administradores
- Historial completo y searchable

### ✅ **Asignación Automática Inteligente**

#### Algoritmo de Asignación
1. **Tickets Globales** → Servicio Técnico → AdminPrincipal (fallback)
2. **Tickets de Bloque** → Creador del bloque → Admin asignado (fallback)
3. **Escalado automático**: 24h sin respuesta → Admin asignado → AdminPrincipal

#### Sistema de Balanceo
- Distribución equitativa entre Administradores Secundarios
- Redistribución automática al agregar nuevos admins
- Prevención de sobrecarga de un administrador

### ✅ **Comunicación Jerárquica**

#### Canales de Comunicación
- **Usuarios** ↔ **Creadores de bloques** (solo bloques cargados)
- **Profesores/Creadores** ↔ **Administrador asignado**
- **Administrador Principal** ↔ **Administradores Secundarios**
- **Sistema de tickets** para incidencias estructuradas

### ✅ **Notificaciones Push en Tiempo Real**

#### Tipos de Notificación
- `new_ticket`: Nuevo ticket asignado
- `new_message`: Nuevo mensaje en ticket
- `status_change`: Cambio de estado
- `escalation`: Ticket escalado

#### Sistema de Entrega
- Notificaciones web en tiempo real
- Badge de conteo no leídas
- Panel desplegable de notificaciones
- Polling automático cada 30 segundos

## Archivos del Sistema

### 📄 **Base de Datos**
```
database-schema-communication.sql
```
- 8 tablas principales + vistas optimizadas
- Triggers automáticos para asignación
- Sistema de escalado automático
- Índices de performance

### 🔧 **Backend API**
```
routes/communication.js
server.js (actualizado)
```
- 15+ endpoints especializados
- Middleware de autenticación
- Upload de archivos con validación
- Sistema de notificaciones

### 🎨 **Frontend Interfaces**
```
support-form.html          # Formulario unificado con redirección
ticket-chat.html           # Chat integrado con sidebar
tickets-list.html          # Panel de gestión con filtros
navigation-service.js       # Integración automática navegación
```

### 📋 **Funcionalidades Implementadas**

#### Formulario Unificado (`support-form.html`)
- ✅ Detección automática de origen (global/bloque)  
- ✅ Categorías filtradas según contexto
- ✅ Redirección inteligente con warnings
- ✅ Upload múltiple de archivos con preview
- ✅ Validación completa y formateo Markdown
- ✅ Asignación automática de prioridad

#### Chat de Tickets (`ticket-chat.html`)
- ✅ Interface tipo WhatsApp/Telegram
- ✅ Sidebar con información completa del ticket
- ✅ Chat en tiempo real con polling
- ✅ Upload de archivos en mensajes
- ✅ Notas internas para moderadores
- ✅ Cambio de estado del ticket
- ✅ Indicadores visuales de mensajes leídos

#### Panel de Gestión (`tickets-list.html`)
- ✅ Vista consolidada de todos los tickets
- ✅ Filtros avanzados (estado, prioridad, búsqueda)
- ✅ Estadísticas en tiempo real
- ✅ Panel de notificaciones integrado
- ✅ Paginación y ordenación
- ✅ Estados visuales y badges

#### Navegación Automática (`navigation-service.js`)
- ✅ Inyección automática de botones de soporte
- ✅ Detección inteligente de ubicación en DOM
- ✅ Botones contextuales según rol de usuario
- ✅ Dropdown de notificaciones en tiempo real
- ✅ Responsive design y mobile-friendly
- ✅ Integración no intrusiva

## Flujo de Uso Completo

### 1. **Reporte de Problema Global**
```
Usuario → Botón "Soporte Técnico" → Formulario Global 
→ Auto-asignación a Servicio Técnico → Chat abierto 
→ Notificación push al responsable
```

### 2. **Reporte de Problema de Bloque**
```
Usuario en bloque → Botón "Reportar Problema" → Formulario de Bloque
→ Auto-asignación al Creador → Chat abierto
→ Notificación push al creador del bloque
```

### 3. **Escalado Automático**
```
Ticket sin respuesta 24h → Escalado al Admin asignado
→ Sin respuesta 24h más → Escalado al AdminPrincipal
→ Notificaciones de escalado automáticas
```

### 4. **Redirección Inteligente**
```
Usuario selecciona categoría incorrecta → Warning automático
→ Opción de redirección al formulario correcto
→ Preservación de datos ingresados
```

## Instalación y Configuración

### 1. **Base de Datos**
```bash
# Aplicar esquema de comunicación
psql -d playtest -f database-schema-communication.sql

# Ejecutar función de escalado (opcional, para testing)
SELECT escalate_tickets();
```

### 2. **Backend**
```bash
# Instalar dependencias adicionales
npm install multer

# El servidor ya incluye las rutas automáticamente
npm start
```

### 3. **Frontend**
```html
<!-- Incluir en todas las páginas donde quieras soporte -->
<script src="navigation-service.js"></script>

<!-- Para botones específicos de bloque -->
<script>
// Agregar botón de reporte en bloque específico
const reportButton = NavigationService.createBlockReportButton(blockId, blockName);
document.getElementById('block-actions').appendChild(reportButton);
</script>
```

## Configuración de Navegación

### Integración Automática
El `NavigationService` se integra automáticamente buscando estos selectores:
- `#navigation, .navigation`
- `#header, .header`  
- `#navbar, .navbar`
- `#menu, .menu`
- `.header-actions, .nav-actions`

### Integración Manual
```javascript
// Crear instancia manual
const navService = new NavigationService();

// Crear botón de bloque específico
const blockButton = NavigationService.createBlockReportButton(123, "Matemáticas");
document.getElementById('my-container').appendChild(blockButton);
```

## API Endpoints

### Tickets
- `POST /api/communication/tickets` - Crear ticket
- `GET /api/communication/tickets` - Listar tickets (con filtros)
- `GET /api/communication/tickets/:id` - Detalles del ticket
- `PATCH /api/communication/tickets/:id/status` - Cambiar estado

### Mensajes
- `POST /api/communication/tickets/:id/messages` - Enviar mensaje
- `GET /api/communication/attachments/:filename` - Descargar adjunto

### Notificaciones
- `GET /api/communication/notifications` - Obtener notificaciones
- `PATCH /api/communication/notifications/:id/read` - Marcar como leída
- `PATCH /api/communication/notifications/read-all` - Marcar todas

### Categorías
- `GET /api/communication/categories/:type` - Obtener categorías filtradas

### Utilidades
- `POST /api/communication/escalate-tickets` - Ejecutar escalado manual

## Configuración Avanzada

### Personalización de Polling
```javascript
// Cambiar intervalos de polling
NavigationService.instance.config.pollingIntervalMs = 15000; // 15 segundos
```

### Personalización de Categorías
```sql
-- Agregar nueva categoría
INSERT INTO ticket_categories (name, origin_type, priority, auto_escalate, description) 
VALUES ('Nueva Categoría', 'global', 'media', false, 'Descripción de la categoría');
```

### Personalización de Escalado
```sql
-- Cambiar tiempo de escalado (en trigger)
NEW.escalate_at := NEW.created_at + INTERVAL '12 hours'; -- En lugar de 24h
```

## Monitoreo y Mantenimiento

### Métricas Importantes
- Tiempo promedio de respuesta por tipo de ticket
- Tickets escalados por semana
- Distribución de carga entre administradores
- Categorías más reportadas

### Tareas de Mantenimiento
```bash
# Ejecutar escalado manual (recomendado cada hora via cron)
curl -X POST http://localhost:3000/api/communication/escalate-tickets \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Limpiar notificaciones antiguas (mensual)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '3 months';

# Archivar tickets cerrados antiguos (trimestral)
UPDATE tickets SET archived = true 
WHERE status = 'cerrado' AND closed_at < NOW() - INTERVAL '6 months';
```

### Logs a Monitorear
- Asignaciones automáticas de tickets
- Escalados ejecutados
- Errores de upload de archivos
- Fallos de notificaciones push

## Extensibilidad

### Nuevos Canales de Comunicación
1. Agregar nuevas categorías en BD
2. Implementar lógica de asignación específica
3. Crear interfaces especializadas si es necesario

### Integración con Sistemas Externos
- Webhook para notificaciones externas
- API de integración con sistemas de email
- Conectores para Slack, Discord, etc.

### Funcionalidades Futuras
- Chat de voz/video integrado
- Traducción automática de mensajes
- IA para categorización automática
- Analytics avanzados de soporte

## Seguridad

### Validaciones Implementadas
- ✅ Autenticación obligatoria para todos los endpoints
- ✅ Verificación de acceso por ticket
- ✅ Validación de tipos de archivo
- ✅ Sanitización de contenido de mensajes
- ✅ Rate limiting en uploads
- ✅ Control de acceso por roles

### Consideraciones de Seguridad
- Archivos adjuntos almacenados fuera del web root
- Validación de MIME types
- Límites de tamaño de archivos y mensajes
- Logs de auditoría para acciones sensibles

Este sistema proporciona una solución completa de comunicación interna con todas las funcionalidades especificadas, lista para producción y altamente escalable.