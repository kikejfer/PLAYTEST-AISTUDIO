# Sistema de Mensajería Híbrida - Documentación de Implementación

## 📋 Resumen Ejecutivo

Se ha implementado exitosamente un **sistema híbrido de comunicación** que combina:
- **Tickets de Soporte Formal** (sistema existente) para reportes técnicos y problemas
- **Mensajería Directa** (nuevo) para comunicación fluida profesor-alumno y creador-jugador

## ✅ Completado (Fase 1)

### 🗄️ Base de Datos

**Archivos creados:**
- `database-schema-direct-messaging.sql` - Esquema completo con documentación
- `playtest-backend/migrations/001-add-direct-messaging.sql` - Script de migración
- `playtest-backend/apply-direct-messaging-migration.js` - Script de aplicación con verificación

**Tablas implementadas:**
1. `conversations` - Gestión de conversaciones entre 2 usuarios
2. `direct_messages` - Mensajes individuales con estado de lectura
3. `message_attachments` - Adjuntos compartidos (tickets + mensajes directos)
4. `typing_status` - Indicadores de "usuario está escribiendo"
5. `user_online_status` - Estado online/offline en tiempo real
6. `conversation_settings` - Configuración por usuario/conversación

**Funciones SQL creadas:**
- `update_conversation_last_message()` - Actualiza timestamp automáticamente
- `notify_direct_message()` - Crea notificaciones al recibir mensajes
- `mark_message_as_read()` - Marca mensaje individual como leído
- `mark_conversation_as_read()` - Marca toda la conversación como leída
- `get_user_conversations()` - Obtiene conversaciones con info completa
- `get_or_create_conversation()` - Obtiene o crea conversación
- `cleanup_expired_typing_status()` - Limpia indicadores expirados

### 🔌 Backend API

**Archivo:** `playtest-backend/routes/direct-messaging.js`

**Endpoints implementados:**

```
GET    /api/messages/conversations
       - Lista conversaciones del usuario con paginación
       - Incluye info de contexto (clase/bloque)

POST   /api/messages/conversations
       - Crea o recupera conversación con otro usuario
       - Valida permisos según contexto (class, block, general)

GET    /api/messages/conversations/:id
       - Detalles completos de una conversación

GET    /api/messages/conversations/:id/messages
       - Mensajes de conversación (paginación por cursor o offset)
       - Incluye adjuntos

POST   /api/messages/conversations/:id/messages
       - Enviar mensaje con adjuntos (max 5 archivos, 10MB cada uno)
       - Emite evento WebSocket en tiempo real

PATCH  /api/messages/:id/read
       - Marcar mensaje individual como leído

PATCH  /api/messages/conversations/:id/read-all
       - Marcar toda conversación como leída

PATCH  /api/messages/conversations/:id/archive
       - Archivar/desarchivar conversación

PATCH  /api/messages/conversations/:id/settings
       - Configurar notificaciones, sonidos, etc.

GET    /api/messages/unread-count
       - Conteo total de mensajes no leídos

GET    /api/messages/search
       - Buscar mensajes por texto

GET    /api/messages/attachments/:filename
       - Descargar adjunto (con control de acceso)
```

### 🔄 WebSocket (Tiempo Real)

**Archivo:** `playtest-backend/websocket/messaging-handler.js`

**Eventos del cliente → servidor:**
- `join_conversation` - Unirse a conversación específica
- `leave_conversation` - Salir de conversación
- `typing_start` - Usuario comenzó a escribir
- `typing_stop` - Usuario dejó de escribir
- `mark_read` - Marcar mensaje como leído
- `mark_conversation_read` - Marcar conversación como leída
- `request_user_status` - Solicitar estado online de usuario

**Eventos del servidor → cliente:**
- `new_message` - Nuevo mensaje recibido
- `user_typing` - Usuario está escribiendo
- `message_read` - Mensaje marcado como leído
- `conversation_read` - Conversación marcada como leída
- `user_status_change` - Cambio de estado online/offline
- `user_joined_conversation` - Usuario se unió a conversación
- `user_left_conversation` - Usuario salió de conversación

**Características:**
- Autenticación JWT en handshake
- Gestión de múltiples conexiones por usuario
- Broadcast automático de estado online a contactos
- Cleanup automático de indicadores de escritura (cron job cada minuto)
- Reconexión automática con backoff exponencial

### 🎨 Frontend React

**Componentes creados:**

1. **ChatWidget** (`src/components/Chat/ChatWidget.jsx`)
   - Componente principal
   - Soporta modo flotante (como WhatsApp Web) o integrado
   - Badge con conteo de no leídos
   - Gestión de estado de conversaciones

2. **ConversationList** (`src/components/Chat/ConversationList.jsx`)
   - Lista de conversaciones con búsqueda
   - Filtros por tipo (clase, bloque, general)
   - Indicadores de no leídos
   - Indicadores de anclado/silenciado
   - Preview del último mensaje

3. **MessageThread** (`src/components/Chat/MessageThread.jsx`)
   - Hilo de mensajes de una conversación
   - Scroll automático a nuevos mensajes
   - Agrupación de mensajes por fecha
   - Indicador de "usuario escribiendo" animado
   - Check marks de lectura (✓ enviado, ✓✓ leído)

4. **MessageInput** (`src/components/Chat/MessageInput.jsx`)
   - Input con auto-resize
   - Soporte de adjuntos con preview
   - Indicador de escritura automático
   - Contador de caracteres
   - Validación de archivos

5. **ChatService** (`src/services/chatService.js`)
   - Servicio singleton para comunicación
   - Gestión de WebSocket con reconexión
   - Métodos API REST completos
   - Event emitter pattern para listeners

**Estilos:** `src/components/Chat/ChatWidget.css`
- Variables CSS personalizables
- Diseño responsive (mobile-first)
- Animaciones suaves
- Dark mode ready (variables preparadas)
- Estados visuales claros

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                            │
│  ChatWidget → ConversationList → MessageThread              │
│                         ↓                                     │
│                   ChatService                                 │
│                    ↓         ↓                                │
│              WebSocket    REST API                           │
└────────────────────┬──────────┬─────────────────────────────┘
                     │          │
                     ↓          ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS                           │
│  MessagingHandler ← Socket.IO → DirectMessagingRoutes       │
│         ↓                              ↓                     │
│    Connection Mgmt              Middleware & Auth            │
└────────────────────┬──────────────────┬─────────────────────┘
                     │                  │
                     ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                         │
│  conversations | direct_messages | message_attachments      │
│  typing_status | user_online_status | conversation_settings │
│  notifications | triggers | functions | indexes             │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Seguridad y Permisos

### Control de Acceso por Contexto

1. **Contexto: class**
   - Profesor puede chatear con sus alumnos
   - Alumnos pueden chatear con su profesor
   - Validación: `class_students` + `classes.teacher_id`

2. **Contexto: block**
   - Creador puede chatear con jugadores de su bloque
   - Jugadores pueden chatear con creador del bloque
   - Validación: `blocks.creator_id` + `game_sessions`

3. **Contexto: general**
   - Cualquier usuario puede chatear con cualquier otro
   - Útil para comunicación libre

### Validación de Adjuntos

- Tipos permitidos: imágenes, PDF, documentos, archivos comprimidos
- Tamaño máximo: 10MB por archivo
- Cantidad máxima: 5 archivos por mensaje
- Total máximo: 50MB por request
- Control de acceso: solo participantes pueden descargar

## 🚀 Cómo Usar

### 1. Aplicar Migración a Base de Datos

```bash
cd playtest-backend
node apply-direct-messaging-migration.js
```

El script:
- Verifica estado actual de las tablas
- Aplica la migración si es necesaria
- Verifica funciones e índices creados
- Muestra estadísticas finales

### 2. Iniciar el Servidor

```bash
cd playtest-backend
npm start
```

El servidor automáticamente:
- Inicializa WebSocket handler
- Registra rutas de mensajería
- Inicia cron job de limpieza de typing status

### 3. Usar en Frontend

#### Modo Flotante (Widget)

```jsx
import { ChatWidget } from './components/Chat';

function App() {
  return (
    <div>
      {/* Tu aplicación */}
      <ChatWidget mode="floating" />
    </div>
  );
}
```

#### Modo Integrado (Panel)

```jsx
import { ChatWidget } from './components/Chat';

function TeacherPanel() {
  return (
    <div className="panel">
      <ChatWidget
        mode="integrated"
        initialConversationId={conversationId}
      />
    </div>
  );
}
```

### 4. Inicializar Chat Service

```javascript
import chatService from './services/chatService';

// En tu componente de autenticación
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    chatService.connect(token);
  }

  return () => {
    chatService.disconnect();
  };
}, []);
```

## 📱 Características Implementadas

### ✅ Mensajería Básica
- Enviar y recibir mensajes de texto
- Adjuntar archivos (imágenes, documentos, etc.)
- Ver historial de mensajes
- Scroll automático a nuevos mensajes

### ✅ Tiempo Real
- Recepción instantánea de mensajes
- Indicador "usuario está escribiendo"
- Estado online/offline de usuarios
- Sincronización de estado de lectura

### ✅ Gestión de Conversaciones
- Lista de conversaciones ordenada por actividad
- Búsqueda de conversaciones por nombre o texto
- Filtros por contexto (clase, bloque)
- Badge con conteo de mensajes no leídos
- Archivar conversaciones

### ✅ Notificaciones
- Notificaciones push del navegador (con permiso)
- Badge visual en el botón flotante
- Badges individuales por conversación
- Configuración de notificaciones por conversación

### ✅ UX/UI
- Diseño responsive (desktop y mobile)
- Animaciones suaves
- Estados de carga claros
- Manejo de errores con mensajes informativos
- Modo flotante o integrado

## 🔧 Variables de Entorno Necesarias

```env
# Backend
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=tu-secreto-jwt
NODE_ENV=production # o development

# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 📋 Próximos Pasos (Fase 2)

### 1. Integración en Paneles

- [ ] **Panel de Profesores**
  - Agregar ChatWidget en modo integrado
  - Botón "Mensaje" en lista de alumnos
  - Tab de "Mensajes" en navegación

- [ ] **Panel de Creadores**
  - ChatWidget integrado
  - Botón "Mensaje" en lista de jugadores
  - Notificaciones de mensajes en dashboard

- [ ] **Panel de Estudiantes/Jugadores**
  - ChatWidget flotante siempre disponible
  - Botón "Contactar Profesor/Creador"
  - Badge en navegación principal

### 2. Testing Completo

- [ ] Testing E2E de flujo completo
- [ ] Testing de WebSocket (conexión/desconexión)
- [ ] Testing de adjuntos
- [ ] Testing de notificaciones
- [ ] Testing de permisos por contexto
- [ ] Load testing (múltiples usuarios simultáneos)

### 3. Optimizaciones

- [ ] Lazy loading de mensajes antiguos
- [ ] Caché de conversaciones en frontend
- [ ] Compresión de imágenes antes de enviar
- [ ] Optimización de queries con joins
- [ ] Rate limiting por usuario

### 4. Funcionalidades Adicionales (Opcional)

- [ ] Mensajes de voz
- [ ] Videollamadas (con WebRTC)
- [ ] Reacciones a mensajes (emojis)
- [ ] Editar mensajes enviados
- [ ] Eliminar mensajes
- [ ] Buscar dentro de conversación
- [ ] Exportar conversación
- [ ] Bloquear usuarios
- [ ] Reportar mensajes inapropiados

## 🐛 Troubleshooting

### WebSocket no conecta

1. Verificar que Socket.IO está inicializado en server.js
2. Verificar CORS configuration
3. Verificar que el token JWT es válido
4. Check browser console para errores

### Migración falla

1. Verificar conexión a base de datos
2. Verificar permisos del usuario de BD
3. Revisar logs en `apply-direct-messaging-migration.js`
4. Ejecutar queries manualmente para debug

### Adjuntos no suben

1. Verificar tamaño de archivo (< 10MB)
2. Verificar tipo de archivo permitido
3. Verificar permisos de carpeta `uploads/messages/`
4. Verificar límite de body-parser en server.js

### Notificaciones no aparecen

1. Verificar permisos del navegador
2. Verificar que el trigger `notify_direct_message` existe
3. Verificar tabla `notifications`
4. Verificar que `conversation_settings.notifications_enabled = true`

## 📖 Referencias

### Archivos Clave

**Backend:**
- `playtest-backend/routes/direct-messaging.js` - Rutas API
- `playtest-backend/websocket/messaging-handler.js` - WebSocket handler
- `playtest-backend/server.js` - Configuración principal (líneas 207-218)
- `playtest-backend/migrations/001-add-direct-messaging.sql` - Migración

**Frontend:**
- `src/components/Chat/ChatWidget.jsx` - Componente principal
- `src/components/Chat/ConversationList.jsx` - Lista conversaciones
- `src/components/Chat/MessageThread.jsx` - Hilo de mensajes
- `src/components/Chat/MessageInput.jsx` - Input de mensajes
- `src/services/chatService.js` - Servicio de comunicación
- `src/components/Chat/ChatWidget.css` - Estilos

**Database:**
- `database-schema-direct-messaging.sql` - Esquema completo
- `playtest-backend/apply-direct-messaging-migration.js` - Script aplicación

### Documentación Externa

- Socket.IO: https://socket.io/docs/v4/
- React: https://react.dev/
- PostgreSQL Functions: https://www.postgresql.org/docs/current/sql-createfunction.html

## 🎯 Estado Actual

### ✅ Completado (100%)
- Esquema de base de datos
- Migraciones y scripts de verificación
- Backend API REST completo
- WebSocket handler con eventos en tiempo real
- Frontend React completo con UI/UX
- Servicio de chat con gestión de conexiones
- Sistema de adjuntos compartido
- Control de permisos por contexto
- Documentación completa

### ⏳ Pendiente
- Integración en paneles de usuarios (3-4 horas)
- Testing end-to-end (2-3 horas)
- Optimizaciones de performance (opcional)
- Features adicionales (opcional)

## 🏁 Conclusión

Se ha implementado exitosamente un **sistema de mensajería híbrida** robusto y escalable que combina lo mejor de dos mundos:

1. **Tickets Formales** - Para soporte técnico y reportes
2. **Chat Directo** - Para comunicación fluida y pedagógica

El sistema está listo para ser integrado en los diferentes paneles de usuario y comenzar a funcionar en producción. La arquitectura es extensible y permite agregar nuevas funcionalidades de manera sencilla.

**Próximo paso recomendado:** Integrar el ChatWidget en el panel de profesores y realizar testing básico con usuarios reales.

---

**Implementado por:** Claude
**Fecha:** 2025-01-06
**Commit:** 4c76260
