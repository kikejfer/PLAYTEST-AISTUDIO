# Papelera - Archivos Obsoletos

Esta carpeta contiene archivos que ya no se utilizan en la aplicación PLAYTEST.

**Fecha de limpieza:** 29 de octubre de 2025
**Total de archivos movidos:** 139

## Estructura de la Papelera

### 📁 backend-antiguo/
Contiene el directorio `/backend` completo que fue reemplazado por `/playtest-backend`.

- **Razón:** El backend antiguo ha sido completamente superseded por la versión en `/playtest-backend`
- **Archivos incluidos:**
  - server.js (versión antigua)
  - routes/ (5 archivos de rutas simples)
  - controllers/ (2 controllers básicos)
  - middleware/ (autenticación simple)
  - package.json y dependencias

### 📁 archivos-backup/
Archivos de respaldo que fueron creados durante el desarrollo pero ya no son necesarios.

**Archivos incluidos:**
- `creators-panel-content-backup.html` - Backup antiguo del panel de creadores
- `creators-panel-content-working.html` - Copia de trabajo del panel de creadores
- `add-questions-module-backup.js` - Backup del módulo de agregar preguntas

**Razón:** Los archivos principales (`creators-panel-content.html` y `add-questions-module.js`) son los que están en uso actualmente.

### 📁 archivos-debug-test/
Archivos de depuración, pruebas manuales, verificación y correcciones que se usaron durante el desarrollo.

**Total:** 26 archivos

**Categorías:**
- **fix-*.{html,js}** - Scripts para corregir problemas específicos de roles y login
- **debug-*.html** - Páginas HTML para depurar funcionalidades
- **test-*.{html,js}** - Tests manuales y páginas de prueba
- **verify-*.js** - Scripts de verificación de juegos y configuraciones
- **check-*.{html,js}** - Scripts para revisar datos y metadata
- **apply-*.js** - Scripts para aplicar correcciones
- **run-migration-*.js** - Scripts de migración antiguos

**Razón:** Estos archivos fueron útiles durante el desarrollo y debugging, pero no son parte de la aplicación en producción.

**Archivos incluidos:**
- apply-role-fixes.js
- auto-login-fix.html
- backend-support-role-endpoint.js
- check-broken-games.js
- check-metadata.html
- debug-admin-dropdowns.html
- debug-support-role.html
- fix-admin-role.js
- fix-user-login.html
- fix-user-roles.html
- role-validation.js
- run-migration-groups.js
- test-admin-panel-section.html
- test-challenges-fix.html
- test-endpoint-simple.js
- test-expandable-debug.html
- test-global-communication.html
- test-groups-system.js
- test-jugadores-debug.html
- test-pap-filters-fix.html
- test-registro-api.js
- verify-all-game-modes.js
- verify-all-recent-games.js
- verify-duel-config.js
- verify-game-data.js
- verify-support-role.html

### 📁 archivos-obsoletos/
Archivos específicos que han sido reemplazados por versiones más nuevas.

**Archivos incluidos:**
- `support-tickets.html` - Reemplazado por `tickets-list.html` (que es referenciado en múltiples archivos HTML principales)
- `roles-simple.js` - Versión simplificada de roles que no se usa en `server.js` (solo se usan `roles.js` y `roles-updated.js`)

### 📁 tests-obsoletos/
Contiene el directorio `pruebas-playwright/Obsoletos/` completo con tests de Playwright descontinuados.

**Contenido:**
- 30+ archivos de tests spec.js organizados en subdirectorios:
  - 01-infraestructura/
  - 02-autenticacion/
  - 03-funcionalidad-core/

**Razón:** Estos tests fueron marcados como obsoletos y movidos a la carpeta `Obsoletos` dentro de `pruebas-playwright`. Ahora se consolidan en la Papelera.

## Notas Importantes

1. **Los archivos en esta carpeta NO se utilizan en la aplicación actual**
2. **Pueden ser eliminados permanentemente** si se confirma que no son necesarios
3. **Antes de eliminar**, revisar que no haya referencias a estos archivos en el código activo
4. Se recomienda mantener esta carpeta durante al menos 1-2 sprints antes de eliminar definitivamente

## Archivos que NO se movieron (aún en uso)

Para referencia, estos archivos similares NO se movieron porque SÍ están en uso:

- `playtest-backend/routes/roles.js` - En uso en `/api/roles`
- `playtest-backend/routes/roles-updated.js` - En uso en `/api/roles-updated`
- `creators-panel-content.html` - Panel principal de creadores (ACTIVO)
- `add-questions-module.js` - Módulo principal para agregar preguntas (ACTIVO)
- `tickets-list.html` - Lista de tickets actual (reemplaza a support-tickets.html)

## Recomendaciones

1. Revisar esta carpeta después de 2-3 semanas de uso sin problemas
2. Si no se detectan regresiones, proceder con la eliminación permanente
3. Antes de eliminar, crear un backup completo del proyecto
4. Documentar cualquier archivo que se restaure y la razón
