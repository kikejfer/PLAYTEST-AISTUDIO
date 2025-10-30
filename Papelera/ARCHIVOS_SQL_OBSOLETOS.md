# Archivos SQL Obsoletos

Esta carpeta contiene archivos SQL que ya no son necesarios en la raíz del proyecto.

**Fecha de limpieza:** 30 de octubre de 2025
**Total de archivos movidos:** 6 archivos SQL

## Archivos SQL Movidos y Razones

### 1. test-nueva-estructura-blocks.sql
**Tipo:** Archivo de testing
**Contenido:** Queries de prueba para la nueva estructura de la tabla blocks
**Razón:** Archivo de test que fue usado durante el desarrollo para verificar la migración de `creator_id` a `user_role_id`. La migración ya está completa y en producción.

### 2. fix-user-blocks-table.sql
**Tipo:** Fix/Migración
**Contenido:** Script para crear la tabla `user_blocks` faltante
**Razón:** Fix que ya debería estar aplicado. La tabla `user_blocks` ya existe en el esquema actual. Este script fue necesario solo durante la migración inicial.

### 3. database-schema-roles-updated.sql
**Tipo:** Schema alternativo/actualización
**Contenido:** Actualización del sistema de roles jerárquico, separación de roles Profesor y Creador
**Razón:** Versión actualizada del schema de roles. El schema principal `database-schema-roles.sql` es el que se usa en `deploy.js`. Este archivo representa una versión alternativa o actualización que probablemente ya está integrada.

### 4. database-schema-unified.sql
**Tipo:** Intento de unificación de schemas
**Contenido:** Script que intenta alinear la base de datos con un schema objetivo, migrando campos como `nombre/apellido` a `first_name/last_name`
**Razón:** Intento de unificación que no se utiliza en el proceso de deployment actual. Los scripts activos usan los schemas modulares individuales.

### 5. database-schema-updates.sql
**Tipo:** Updates/mejoras de schema
**Contenido:** Tablas nuevas: `topic_answers`, `block_answers`, y campos adicionales a usuarios
**Razón:** Updates que ya deberían estar aplicados o integrados en los schemas principales. No se referencia en `deploy.js` ni en `auto-migrate.js`.

### 6. database-schema-blocks-expanded.sql
**Tipo:** Expansión de funcionalidades
**Contenido:** Sistema de áreas de conocimiento, metadatos avanzados de bloques, visibilidad
**Razón:** Expansión del schema de bloques que probablemente ya está integrada en el schema principal o en migraciones específicas.

## Archivos SQL Activos (Mantenidos en Raíz)

Estos archivos SQL **SÍ se utilizan** activamente en el proyecto:

### Usados por `/playtest-backend/deploy.js`:
- `database-schema.sql` - Schema base principal
- `database-schema-roles.sql` - Sistema de roles
- `database-schema-communication.sql` - Sistema de comunicación

### Usados por scripts de actualización en `/playtest-backend/`:
- `database-schema-creators-panel.sql` - Panel de creadores (usado por `update-creators-schema.js`)
- `database-schema-integrations.sql` - Integraciones externas (usado por `update-integrations-schema.js`)
- `database-schema-luminarias.sql` - Sistema de luminarias (usado por `update-luminarias-schema.js`)
- `database-schema-support.sql` - Sistema de soporte (usado por `update-support-schema.js`)
- `database-schema-teachers-panel.sql` - Panel de profesores (usado por `update-teachers-schema.js`)

### Migraciones activas:
- `playtest-backend/migrations/create-block-assignments-table.sql` - Migración de asignaciones
- `playtest-backend/migrations/add-block-metadata-columns.sql` - Metadatos de bloques
- `migrations/add-block-scope.sql` - Scope de bloques

## Archivos HTML - Análisis

**Total de archivos HTML en raíz:** 49 archivos
**Archivos HTML movidos a Papelera:** 0
**Razón:** Después de un análisis exhaustivo, todos los archivos HTML están activamente en uso:

### Archivos HTML principales activos:
1. **Páginas de entrada y componentes:**
   - `index.html` - Página principal
   - `header-component.html` - Componente de cabecera reutilizable
   - `modals-component.html` - Componentes de modales

2. **Paneles administrativos:**
   - `admin-principal-panel.html` - Panel principal (referenciado en navigation-service.js)
   - `admin-secundario-panel.html` - Panel secundario (referenciado en navigation-service.js e index.html)
   - `feature-flags-admin-panel.html` - Feature flags

3. **Paneles de usuarios:**
   - `creators-panel-content.html` - Panel de creadores (referenciado en navigation-service.js)
   - `creators-panel-analytics.html` - Analytics de creadores
   - `creators-panel-players.html` - Jugadores de creadores
   - `teachers-panel-main.html` - Panel principal de profesores
   - `teachers-panel-schedules.html` - Horarios (referenciado en navigation-service.js)
   - `teachers-panel-groups.html` - Grupos (referenciado en navigation-service.js)
   - `teachers-panel-students.html` - Estudiantes
   - `teachers-panel-assign-block.html` - Asignación de bloques
   - `teachers-panel-group-detail.html` - Detalle de grupo
   - `profesores-panel-funcionalidades.html` - Funcionalidades (referenciado en navigation-service.js)
   - `jugadores-panel-gaming.html` - Panel de jugador (referenciado en navigation-service.js)

4. **Modalidades de juego (9 archivos, todas activas):**
   - `game-classic.html`
   - `game-duel.html`
   - `game-exam.html`
   - `game-lives.html`
   - `game-marathon.html`
   - `game-streak.html`
   - `game-time-trial.html`
   - `game-trivial.html`
   - `game-by-levels.html`

5. **Gestión de bloques y preguntas:**
   - `add-question.html` - Crear pregunta (referenciado en index.html)
   - `create-block-expanded.html` - Crear bloque
   - `available-blocks.html` - Bloques disponibles (referenciado en index.html)
   - `all-blocks.html` - Todos los bloques (referenciado en index.html)
   - `block-management.html` - Gestión de bloques
   - `block-preview.html` - Preview de bloques
   - `block-questions.html` - Preguntas de bloque (referenciado en index.html)
   - `block-search.html` - Búsqueda de bloques

6. **Sistema de juegos:**
   - `active-game.html` - Juego activo (referenciado en index.html)
   - `all-games.html` - Historial de juegos (referenciado en header-component.html, index.html)

7. **Sistema de desafíos:**
   - `challenges-user-panel.html` - Panel de desafíos usuario
   - `challenges-management-panel.html` - Gestión de desafíos

8. **Sistema de luminarias:**
   - `luminarias-admin.html` - Admin de luminarias
   - `luminarias-store.html` - Tienda
   - `luminarias-marketplace.html` - Mercado
   - `luminarias-conversion.html` - Conversión
   - `luminarias-history.html` - Historial

9. **Sistema de soporte:**
   - `support-form.html` - Formulario (referenciado en header-component.html)
   - `support-dashboard.html` - Dashboard (referenciado en navigation-service.js)
   - `support-analytics.html` - Analytics
   - `support-knowledge.html` - Base de conocimiento
   - `tickets-list.html` - Lista de tickets (referenciado en header-component.html)
   - `ticket-chat.html` - Chat de ticket

### Conclusión sobre archivos HTML:
Todos los archivos HTML están integrados en el sistema de navegación, componentes compartidos, o son accesibles directamente desde páginas principales. No se encontraron archivos HTML claramente obsoletos o sin referencias.

## Notas Importantes

1. Los archivos SQL en esta carpeta fueron usados durante el desarrollo y migraciones
2. Se conservan como referencia histórica del proceso de migración
3. Los schemas activos están bien documentados y se usan en los scripts de deployment
4. Antes de eliminar permanentemente, verificar que no hay información única de migraciones

## Recomendaciones

- Mantener estos archivos durante al menos 3 meses
- Si no se necesita revertir ninguna migración, se pueden eliminar de forma permanente
- Los archivos HTML están todos activos - no eliminar ninguno
