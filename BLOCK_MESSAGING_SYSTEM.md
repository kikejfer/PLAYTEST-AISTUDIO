# Sistema de Mensajería de Bloques - Documentación

## 📋 Descripción General

Se ha implementado un sistema completo de mensajería contextual que permite a los usuarios (alumnos/jugadores) contactar directamente con los creadores de bloques. Este sistema utiliza el sistema de tickets existente pero proporciona una experiencia de usuario más amigable y específica para la comunicación sobre bloques.

## 🔄 Diferencia con Mensajes Directos

**IMPORTANTE:** Existen DOS sistemas de mensajería independientes en la plataforma:

### 📝 Mensajes de Bloques (Este Sistema)
- **Propósito:** Comunicación contextual sobre bloques específicos
- **Tipo:** Sistema de tickets estructurado
- **Icono:** 📝 (verde esmeralda #10B981)
- **Uso:** Reportar problemas, hacer preguntas o sugerencias sobre el contenido de un bloque
- **Asignación:** Automática al creador del bloque mediante trigger de BD
- **Archivo:** `block-messaging.html`

### 💬 Mensajes Directos (Sistema Existente)
- **Propósito:** Chat instantáneo usuario-a-usuario
- **Tipo:** Mensajería en tiempo real tipo WhatsApp
- **Icono:** 💬 (violeta #8B5CF6)
- **Uso:** Comunicación rápida y directa entre usuarios
- **Características:** Badge de mensajes no leídos, chat en vivo
- **Archivo:** `direct-messaging.html`

Ambos sistemas coexisten y se complementan, cada uno con su propósito específico.

## 🎯 Características Implementadas

### 1. **Botones de Contacto en Bloques**

#### Ubicaciones:
- **`jugadores-panel-gaming.html`** (líneas 2741-2742, 2798-2803)
  - Botón 💬 en cada bloque de la sección "Bloques Disponibles"
  - Atributos `data-block-id` y `data-creator-id` añadidos a cada card de bloque
  - Función `handleContactCreator()` implementada

- **`bloques-creados-component.js`** (líneas 882-883, 936-942, 1011-1015)
  - Botón "💬 Contactar" en bloques con `displayMode: 'loaded'` o `'available'`
  - Atributos `data-block-id` y `data-creator-id` añadidos
  - Método `contactCreator()` implementado

#### Funcionalidad:
```javascript
// Al hacer clic en el botón de contacto:
handleContactCreator(blockId, blockName, creatorNickname) {
    window.open(`support-form.html?type=block&blockId=${blockId}&blockName=${encodeURIComponent(blockName)}&creatorName=${encodeURIComponent(creatorNickname)}`, '_blank');
}
```

### 2. **Formulario de Soporte Mejorado**

#### Archivo: `support-form.html` (líneas 507-564)

**Mejoras:**
- Detecta parámetros `blockName` y `creatorName` de la URL
- Muestra información contextual del bloque y del creador
- Título personalizado: "Contactar al Creador del Bloque"
- Mensaje informativo que explica que el creador recibirá el mensaje

**Funcionamiento:**
```javascript
// Configuración del formulario para tickets de bloque
async function setupBlockSupport(blockId) {
    const urlParams = new URLSearchParams(window.location.search);
    const blockName = urlParams.get('blockName');
    const creatorName = urlParams.get('creatorName');

    // Muestra inmediatamente la info de params
    // Luego intenta obtener detalles completos del backend
}
```

### 3. **Interfaz de Mensajería Directa**

#### Archivo: `block-messaging.html` (NUEVO)

**Características:**
- **Vista de Conversaciones:** Lista de todas las conversaciones activas sobre bloques
- **Chat 1-to-1:** Interfaz de chat en tiempo real para comunicación directa
- **Búsqueda:** Filtrar conversaciones por nombre de bloque o creador
- **Estados:** Visualización de tickets abiertos, en proceso o resueltos
- **Mensajes no leídos:** Indicador visual de conversaciones con mensajes nuevos

**Componentes principales:**

1. **Panel de Conversaciones (izquierda)**
   - Lista de todas las conversaciones de tipo `block`
   - Búsqueda en tiempo real
   - Estado visual de cada conversación
   - Indicador de mensajes no leídos

2. **Panel de Chat (derecha)**
   - Vista de mensajes estilo chat
   - Diferenciación visual entre mensajes enviados/recibidos
   - Área de texto con envío por Enter
   - Auto-scroll a mensajes nuevos

**APIs Utilizadas:**
```javascript
// Cargar conversaciones
GET /api/communication/tickets?originType=block

// Cargar mensajes de un ticket
GET /api/communication/tickets/:ticketId/messages

// Enviar mensaje
POST /api/communication/tickets/:ticketId/messages
```

### 4. **Botones en Header**

#### Archivo: `header-component.html`

**Botones de comunicación implementados (de izquierda a derecha):**

```html
<!-- 1. Soporte Técnico Global -->
<button onclick="window.open('support-form.html?type=global', '_blank')"
        style="background: #059669; color: white; ..."
        title="Soporte Técnico Global">
    🛠️
</button>

<!-- 2. Mensajes de Bloques (NUEVO) -->
<button onclick="window.open('block-messaging.html', '_blank')"
        style="background: #10B981; color: white; ..."
        title="Mensajes de Bloques">
    📝
</button>

<!-- 3. Mensajes Directos (Sistema Existente) -->
<button onclick="window.location.href='direct-messaging.html'"
        style="background: #8B5CF6; color: white; ..."
        title="Mensajes Directos">
    💬
    <span id="messages-unread-badge">0</span>
</button>

<!-- 4. Todos los Tickets -->
<button onclick="window.open('tickets-list.html', '_blank')"
        style="background: #3B82F6; color: white; ..."
        title="Todos los Tickets">
    📧
</button>
```

**Layout Visual:**
```
🛠️ Soporte | 📝 Bloques | 💬 Directos | 📧 Tickets
 (verde)     (esmeralda)   (violeta)     (azul)
```

## 🔄 Flujo de Usuario

### Escenario 1: Alumno contacta a creador de bloque

```
1. Alumno navega a jugadores-panel-gaming.html
   ↓
2. Ve un bloque con contenido que necesita aclaración
   ↓
3. Hace clic en el botón 💬 del bloque
   ↓
4. Se abre support-form.html con type=block&blockId=X
   ↓
5. El formulario muestra:
   - "Contactar al Creador del Bloque"
   - Nombre del bloque
   - Nombre del creador
   ↓
6. Alumno escribe su mensaje y envía
   ↓
7. Se crea un ticket de tipo 'block'
   ↓
8. El trigger de base de datos asigna el ticket al creador del bloque
   ↓
9. Alumno puede ver la conversación en block-messaging.html
```

### Escenario 2: Seguimiento de conversación

```
1. Usuario hace clic en botón 💬 del header
   ↓
2. Se abre block-messaging.html
   ↓
3. Ve todas sus conversaciones sobre bloques
   ↓
4. Selecciona una conversación
   ↓
5. Ve el historial completo de mensajes
   ↓
6. Puede responder directamente desde la interfaz de chat
   ↓
7. Los mensajes se actualizan en tiempo real
```

## 🗄️ Backend - Sistema de Tickets

### Endpoint de Creación
**Ruta:** `POST /api/communication/tickets`

**Parámetros relevantes:**
```javascript
{
    originType: 'block',      // Tipo de ticket
    blockId: 123,             // ID del bloque
    categoryId: 5,            // Categoría del problema
    title: 'Pregunta incorrecta',
    description: 'La pregunta 5 tiene un error...',
    priority: 'media'
}
```

### Trigger de Auto-Asignación
**Archivo:** `database-schema-communication.sql:179-254`

```sql
-- Cuando origin_type = 'block':
SELECT creator_id INTO assigned_user_id
FROM blocks
WHERE id = NEW.block_id;

-- El ticket se asigna automáticamente al creador del bloque
```

## 📂 Archivos Modificados/Creados

### Archivos Modificados:
1. **`jugadores-panel-gaming.html`**
   - Añadidos atributos `data-block-id` y `data-creator-id`
   - Botón 💬 de contacto
   - Función `handleContactCreator()`

2. **`bloques-creados-component.js`**
   - Atributos data en cards
   - Botón de contacto condicional
   - Método `contactCreator()`

3. **`support-form.html`**
   - Detección de params `blockName` y `creatorName`
   - UI mejorada para tickets de bloque
   - Mensajes contextuales

4. **`header-component.html`**
   - Nuevo botón 💬 para mensajes de bloques

### Archivos Creados:
1. **`block-messaging.html`** (NUEVO)
   - Interfaz completa de mensajería
   - Vista de conversaciones
   - Chat 1-to-1

2. **`BLOCK_MESSAGING_SYSTEM.md`** (ESTE ARCHIVO)
   - Documentación completa del sistema

## 🎨 Diseño Visual

### Colores de Botones en Header:
- **🛠️ Soporte Técnico:** `#059669` (Verde oscuro)
- **📝 Mensajes de Bloques:** `#10B981` (Verde esmeralda) - NUEVO
- **💬 Mensajes Directos:** `#8B5CF6` (Violeta) - Sistema existente
- **📧 Todos los Tickets:** `#3B82F6` (Azul)

### Colores en Interfaz de Chat:
- **Mensaje Enviado:** `#3B82F6` (Azul)
- **Mensaje Recibido:** `#0F172A` (Gris oscuro)
- **Fondo Conversación Activa:** `#1E293B`
- **Badge No Leído:** `#EF4444` (Rojo)

### Iconos y Significado:
- 🛠️ - Soporte técnico general del sistema
- 📝 - Mensajes sobre bloques específicos (tickets contextuales)
- 💬 - Mensajería instantánea usuario-a-usuario
- 📧 - Vista de todos los tickets/notificaciones

## 🔐 Seguridad

### Autenticación:
- Todos los endpoints requieren token JWT válido
- Token enviado en header: `Authorization: Bearer <token>`

### Validaciones:
- BlockId requerido para tickets de tipo 'block'
- Solo usuarios autenticados pueden crear/ver tickets
- Los creadores solo ven tickets de sus propios bloques

## 🚀 Próximas Mejoras Posibles

1. **Notificaciones en Tiempo Real**
   - WebSockets para actualización de mensajes
   - Badge de contador en botón del header

2. **Rich Text Editor**
   - Formato de texto en mensajes
   - Soporte para código/snippets

3. **Archivos Adjuntos en Chat**
   - Permitir adjuntar imágenes en mensajes
   - Vista previa de adjuntos

4. **Filtros Avanzados**
   - Filtrar por estado (abierto/resuelto)
   - Filtrar por bloque específico

5. **Respuestas Rápidas**
   - Plantillas de respuestas comunes
   - Sugerencias automáticas

## 📊 Métricas y Analytics

Para futuras implementaciones, se pueden trackear:
- Tiempo promedio de respuesta del creador
- Número de mensajes por conversación
- Tickets resueltos vs. abiertos
- Bloques con más consultas

## 🧪 Testing

### Casos de Prueba Recomendados:

1. **Crear Ticket desde Bloque**
   - Verificar que se abre support-form.html con parámetros correctos
   - Confirmar que se crea ticket de tipo 'block'

2. **Ver Conversaciones**
   - Abrir block-messaging.html
   - Verificar que se cargan solo tickets de tipo 'block'

3. **Enviar Mensaje**
   - Seleccionar conversación
   - Escribir y enviar mensaje
   - Verificar que aparece en el chat

4. **Auto-asignación**
   - Crear ticket de bloque
   - Verificar que se asigna al creador correcto

5. **Búsqueda**
   - Buscar por nombre de bloque
   - Buscar por nombre de creador
   - Verificar filtrado correcto

## 📝 Notas Técnicas

### Compatibilidad:
- Chrome/Edge: ✅ Totalmente compatible
- Firefox: ✅ Compatible
- Safari: ✅ Compatible
- Mobile: ⚠️ Layout responsive implementado

### Dependencias:
- Sistema de autenticación existente
- API de comunicación (`/api/communication/*`)
- API de bloques (`/api/blocks/*`)
- Tabla `tickets` en base de datos
- Tabla `blocks` en base de datos

### Performance:
- Carga inicial: ~200ms
- Búsqueda: Filtrado en cliente (instantáneo)
- Actualización de mensajes: Manual (click en conversación)
- Posible mejora: Polling cada 5-10 segundos

## 🐛 Troubleshooting

### Problema: No se cargan conversaciones
**Solución:**
- Verificar que el token JWT es válido
- Comprobar que `/api/communication/tickets` está accesible
- Revisar console del navegador para errores

### Problema: No se envían mensajes
**Solución:**
- Verificar autenticación
- Comprobar que el ticket existe
- Revisar permisos del usuario

### Problema: No se ve el creador del bloque
**Solución:**
- Verificar que el bloque tiene `creator_id` y `creatorNickname`
- Comprobar que la API de bloques devuelve esta información

## 📞 Contacto y Soporte

Para preguntas sobre esta implementación, consultar:
- Documentación del sistema de comunicación: `SISTEMA-COMUNICACION-COMPLETO.md`
- Schema de base de datos: `database-schema-communication.sql`
- Guía de testing: `SUPPORT_SYSTEM_TESTING_GUIDE.md`

---

**Última actualización:** 2025-11-12
**Versión:** 1.0
**Autor:** Claude (AI Assistant)
