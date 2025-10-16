# GUÍA DE VERIFICACIÓN - Sistema de Grupos y Asignaciones

**Fecha**: 2025-10-16
**Versión**: 2.0.0 (Fase 2)

Esta guía te permitirá verificar paso a paso todas las funcionalidades implementadas en el sistema de grupos y asignaciones.

---

## 📋 ÍNDICE DE VERIFICACIONES

1. [Verificación del Backend](#1-verificación-del-backend)
2. [Verificación del Frontend - Panel Profesor](#2-verificación-del-frontend---panel-profesor)
3. [Verificación de Flujo Completo](#3-verificación-de-flujo-completo)
4. [Verificación de Panel Alumno](#4-verificación-de-panel-alumno-próximamente)
5. [Solución de Problemas Comunes](#5-solución-de-problemas-comunes)

---

## 1. VERIFICACIÓN DEL BACKEND

### 1.1. Verificar que el Backend esté corriendo

```bash
cd playtest-backend
node server.js
```

**Resultado esperado:**
```
🚀 Server running on port 3000
📱 Environment: development
🔌 WebSocket server enabled
✅ Sistema de tablas unificadas verificado
🏆 Sistema de niveles verificado y funcionando
Deploy timestamp: ...
```

### 1.2. Ejecutar Tests de Sistema

```bash
# Desde el directorio raíz del proyecto
node test-groups-system.js
```

**Resultado esperado:**
```
✅ Todas las pruebas pasaron: 6/6

TEST 1: Database Schema Verification ✅
TEST 2: Data Integrity ✅
TEST 3: Access Control Logic ✅
TEST 4: Groups Table Functionality ✅
TEST 5: Block Assignments Table Functionality ✅
TEST 6: Indexes Verification ✅
```

**Si algún test falla:** Revisa que el archivo `.env` tenga todas las credenciales correctas.

### 1.3. Verificar Endpoints en Postman/Thunder Client

#### Endpoint 1: Crear Grupo
```http
POST http://localhost:3000/api/groups
Headers:
  Authorization: Bearer <TU_TOKEN>
  X-Current-Role: PPF
  Content-Type: application/json

Body:
{
  "name": "Matemáticas 3º ESO - Test",
  "description": "Grupo de prueba",
  "access_code": "MAT3A1"
}
```

**Resultado esperado:** Status 201, respuesta con el grupo creado y su access_code.

#### Endpoint 2: Listar Grupos
```http
GET http://localhost:3000/api/groups
Headers:
  Authorization: Bearer <TU_TOKEN>
  X-Current-Role: PPF
```

**Resultado esperado:** Status 200, array de grupos con `member_count` y `assigned_blocks_count`.

#### Endpoint 3: Asignar Bloque
```http
POST http://localhost:3000/api/groups/assign-block
Headers:
  Authorization: Bearer <TU_TOKEN>
  X-Current-Role: PPF
  Content-Type: application/json

Body:
{
  "block_id": 1,
  "group_id": 1,
  "due_date": "2025-11-01T00:00:00Z",
  "notes": "Completar antes del examen"
}
```

**Resultado esperado:** Status 201, confirmación de asignación creada.

#### Endpoint 4: Bloques Disponibles (con control de acceso)
```http
GET http://localhost:3000/api/blocks/available
Headers:
  Authorization: Bearer <TU_TOKEN>
  X-Current-Role: PJG
```

**Resultado esperado:** Status 200, solo bloques PUBLICO o asignados al usuario.

---

## 2. VERIFICACIÓN DEL FRONTEND - PANEL PROFESOR

### 2.1. Iniciar Frontend

```bash
# Si usas un servidor local (ejemplo: Live Server en VS Code)
# O simplemente abre index.html en el navegador
```

### 2.2. Login como Profesor

**Pasos:**
1. Abre `index.html` en tu navegador
2. Introduce credenciales de un usuario con rol "profesor"
3. Click en "Iniciar Sesión"

**Resultado esperado:**
- Redirección al panel de selección de roles
- Ver la opción "Panel de Profesores (PPF)"

### 2.3. Acceder al Panel de Profesores

**Pasos:**
1. Click en "Panel de Profesores (PPF)"
2. Deberías ver `profesores-panel-funcionalidades.html`

**Resultado esperado:**
- 6 tarjetas de funcionalidades
- Nueva tarjeta: "👥 Gestión de Grupos" (debería estar habilitada)
- Botón "Gestionar Grupos" clickeable

### 2.4. Vista Principal de Grupos

**Pasos:**
1. Click en "Gestionar Grupos" desde el panel de funcionalidades
2. Deberías ver `teachers-panel-groups.html`

**Verificaciones:**
- ✅ Header con nombre de usuario correcto
- ✅ Botón "Crear Grupo" visible
- ✅ Si no hay grupos: mensaje "No tienes grupos creados"
- ✅ Si hay grupos: grid con tarjetas de grupos

**Elementos de cada tarjeta de grupo:**
- Nombre del grupo
- Código de acceso
- Número de estudiantes
- Número de bloques asignados
- Botones: Ver, Asignar, Eliminar

### 2.5. Crear Nuevo Grupo

**Pasos:**
1. Click en botón "+ Crear Grupo"
2. Se abre modal "Crear Nuevo Grupo"

**Formulario - Campos obligatorios:**
- ✅ Nombre del Grupo (requerido)
- ✅ Descripción (opcional)
- ✅ Código de Acceso (opcional - se genera si está vacío)

**Prueba 1: Crear grupo con código personalizado**
```
Nombre: Matemáticas 3º ESO
Descripción: Grupo de matemáticas del curso 2024-2025
Código: MAT3A
```

**Resultado esperado:**
- Alert: "✅ Grupo creado exitosamente"
- Muestra el código de acceso
- El grupo aparece en el grid
- Código de acceso es "MAT3A"

**Prueba 2: Crear grupo sin código**
```
Nombre: Física 4º ESO
Descripción: (dejar vacío)
Código: (dejar vacío)
```

**Resultado esperado:**
- Se genera un código automático (6 caracteres alfanuméricos)
- El grupo aparece en el grid

### 2.6. Vista de Detalle de Grupo

**Pasos:**
1. Click en botón "👁️ Ver" de cualquier grupo
2. Deberías ver `teachers-panel-group-detail.html?id=X`

**Verificaciones en el Header del Grupo:**
- ✅ Nombre del grupo
- ✅ Descripción (si tiene)
- ✅ Código de acceso destacado
- ✅ Estadísticas: Miembros, Bloques Asignados, Fecha de Creación

**Tabs disponibles:**
- ✅ Tab "👥 Miembros" (activo por defecto)
- ✅ Tab "📚 Asignaciones"

**En Tab Miembros:**
- ✅ Barra de búsqueda funcional
- ✅ Botón "+ Añadir Miembros"
- ✅ Si no hay miembros: mensaje "No hay miembros en este grupo"
- ✅ Si hay miembros: lista con avatar, nombre, email, botón eliminar

### 2.7. Añadir Miembros a Grupo (Modal)

**Pasos:**
1. Desde detalle de grupo, click en "+ Añadir Miembros"
2. Se abre modal "Añadir Miembros al Grupo"

**Estado actual:**
- Muestra mensaje: "Para añadir miembros, ve a la sección de 'Gestión de Alumnos'"
- Nota: "Próximamente: selección directa desde aquí"

**Nota técnica:** Esta funcionalidad está preparada pero requiere endpoint adicional para listar usuarios con rol "jugador".

### 2.8. Eliminar Miembro de Grupo

**Pasos:**
1. Desde lista de miembros, click en botón 🗑️ de un miembro
2. Confirm: "¿Eliminar a [nombre] del grupo?"

**Resultado esperado:**
- Confirmación requerida
- Alert: "✅ Miembro eliminado exitosamente"
- El miembro desaparece de la lista
- El contador de miembros se actualiza

### 2.9. Vista de Asignación de Bloques

**Pasos:**
1. Desde detalle de grupo, click en botón "📚 Asignar" (o desde grid principal)
2. Deberías ver `teachers-panel-assign-block.html?groupId=X`

**Paso 1: Seleccionar Bloque**

**Verificaciones:**
- ✅ Indicador de pasos: "1. Seleccionar Bloque" activo
- ✅ Barra de búsqueda funcional
- ✅ Grid con bloques creados por el profesor
- ✅ Cada tarjeta muestra: nombre, descripción, número de preguntas
- ✅ Click en tarjeta la marca como seleccionada (borde verde)
- ✅ Botón "Siguiente →" se habilita al seleccionar un bloque

**Prueba de Búsqueda:**
- Escribe parte del nombre de un bloque
- Solo deberían aparecer bloques que coincidan

**Prueba de Selección:**
- Click en un bloque
- Borde cambia a verde
- Botón "Siguiente →" se habilita

**Paso 2: Configurar Asignación**

**Pasos:**
1. Click en "Siguiente →"
2. Deberías ver el formulario de configuración

**Verificaciones del Formulario:**
- ✅ Muestra bloque seleccionado en recuadro destacado
- ✅ Select "Asignar A": opciones "Grupo Completo" / "Estudiante Individual"
- ✅ Select "Grupo": pre-seleccionado si venías de un grupo específico
- ✅ Input "Fecha Límite" (opcional, tipo datetime-local)
- ✅ Textarea "Notas" (opcional)
- ✅ Botones: "← Atrás" y "✅ Asignar Bloque"

**Prueba 1: Asignar a Grupo**
```
Asignar A: Grupo Completo
Grupo: Matemáticas 3º ESO
Fecha Límite: 2025-11-15 23:59
Notas: Completar antes del examen trimestral
```

**Resultado esperado:**
- Click en "✅ Asignar Bloque"
- Alert: "✅ Bloque asignado exitosamente"
- Redirección a detalle del grupo

**Prueba 2: Asignar a Individual**
```
Asignar A: Estudiante Individual
Estudiante: (muestra mensaje "Próximamente")
```

**Nota técnica:** La asignación individual está implementada en backend pero requiere endpoint para listar estudiantes.

### 2.10. Eliminar Grupo

**Pasos:**
1. Desde grid de grupos, click en botón 🗑️
2. Confirm: "¿Estás seguro de que deseas eliminar el grupo...?"

**Resultado esperado:**
- Warning sobre eliminación de asignaciones
- Confirmación requerida
- Alert: "✅ Grupo eliminado exitosamente"
- El grupo desaparece del grid

---

## 3. VERIFICACIÓN DE FLUJO COMPLETO

### Flujo 1: Profesor Crea Grupo y Asigna Bloque

**Objetivo:** Verificar el flujo completo desde la creación hasta la asignación.

**Pasos detallados:**

1. **Login como Profesor**
   - Usuario: (tu usuario profesor)
   - Password: (tu contraseña)

2. **Crear Grupo Nuevo**
   - Panel Profesores → Gestionar Grupos → Crear Grupo
   - Nombre: "Historia 2º Bachillerato"
   - Código: "HIST2B"
   - Guardar

3. **Verificar Grupo Creado**
   - El grupo aparece en el grid
   - Código mostrado es "HIST2B"
   - Contador de miembros: 0
   - Contador de bloques: 0

4. **Ver Detalle del Grupo**
   - Click en "Ver" del grupo recién creado
   - Header muestra toda la información correcta

5. **Asignar un Bloque**
   - Click en "📚 Asignar Bloque"
   - Seleccionar un bloque de tu lista
   - Configurar:
     - Asignar a: Grupo Completo
     - Grupo: Historia 2º Bachillerato
     - Fecha: 2025-11-30 23:59
     - Notas: "Repasar para el examen final"
   - Asignar

6. **Verificar Asignación**
   - Volver a detalle del grupo
   - Contador de bloques asignados: 1
   - (Tab Asignaciones mostrará mensaje de desarrollo)

**Resultado esperado:** ✅ Todo el flujo completa sin errores.

### Flujo 2: Verificar Control de Acceso

**Objetivo:** Verificar que los bloques CLASE solo son visibles para quien debe verlos.

**Pasos:**

1. **Crear Bloque con Scope CLASE (desde backend)**
   ```sql
   UPDATE blocks
   SET block_scope = 'CLASE', owner_user_id = <tu_user_id>
   WHERE id = <block_id>;
   ```

2. **Asignar ese bloque a un grupo**

3. **Login como estudiante NO del grupo**
   - Ir a /api/blocks/available
   - El bloque CLASE NO debería aparecer

4. **Login como estudiante del grupo**
   - El bloque CLASE DEBERÍA aparecer

**Nota:** Este flujo requiere panel de alumno (próximamente).

---

## 4. VERIFICACIÓN DE PANEL ALUMNO (PRÓXIMAMENTE)

Esta sección se completará cuando se implemente el panel de alumno.

**Funcionalidades pendientes:**
- Vista de "Mis Grupos"
- Vista de "Bloques Asignados"
- Unirse a grupo con código de acceso

---

## 5. SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "Error al cargar grupos"

**Posibles causas:**
- Backend no está corriendo
- Token de sesión expirado
- Rol incorrecto en header

**Solución:**
1. Verificar que `node server.js` esté corriendo
2. Cerrar sesión y volver a loguearse
3. Verificar en consola del navegador el header `X-Current-Role`

### Problema 2: Modal no se abre

**Solución:**
- Revisar consola del navegador (F12)
- Verificar que los archivos HTML estén en la misma carpeta
- Refrescar página (Ctrl+F5)

### Problema 3: Los grupos no aparecen después de crearlos

**Solución:**
1. Verificar en consola del navegador si hay errores
2. Verificar que la respuesta del backend fue 201
3. Refrescar la página manualmente

### Problema 4: "Block not found or not accessible" al cargar bloques

**Solución:**
- Verificar que el usuario tenga bloques creados
- Ir a panel de jugadores y crear al menos un bloque
- O usar endpoint POST /api/blocks desde Postman

### Problema 5: CORS errors

**Solución:**
1. Verificar que el frontend esté en localhost
2. Agregar el puerto del frontend a `playtest-backend/server.js`:
   ```javascript
   const allowedOrigins = [
       'http://localhost:5173',
       'http://localhost:3000',
       'http://localhost:58500',
       'http://localhost:XXXX',  // Tu puerto
   ];
   ```
3. Reiniciar el backend

---

## 6. CHECKLIST FINAL DE VERIFICACIÓN

Marca cada item al verificarlo:

### Backend
- [ ] Backend corriendo sin errores
- [ ] Test suite 6/6 pasando
- [ ] Endpoint POST /groups funciona
- [ ] Endpoint GET /groups funciona
- [ ] Endpoint POST /groups/assign-block funciona
- [ ] Endpoint GET /blocks/available respeta control de acceso

### Frontend - Panel Profesor
- [ ] Login como profesor funciona
- [ ] Panel de funcionalidades muestra "Gestión de Grupos"
- [ ] Vista de grupos carga correctamente
- [ ] Crear grupo funciona (con y sin código personalizado)
- [ ] Detalle de grupo muestra información correcta
- [ ] Asignación de bloques - Paso 1 (selección) funciona
- [ ] Asignación de bloques - Paso 2 (configuración) funciona
- [ ] Asignación se guarda en base de datos
- [ ] Eliminar miembro funciona
- [ ] Eliminar grupo funciona
- [ ] Búsquedas funcionan (grupos, bloques, miembros)

### Navegación
- [ ] Volver atrás funciona en todas las vistas
- [ ] Cerrar sesión funciona
- [ ] Links entre vistas funcionan correctamente

### Base de Datos
- [ ] Tabla `groups` tiene registros
- [ ] Tabla `group_members` tiene registros
- [ ] Tabla `block_assignments` tiene registros
- [ ] Columna `block_scope` en blocks funciona

---

## 7. ARCHIVOS CREADOS/MODIFICADOS

### Archivos de Frontend (Nuevos)
- ✅ `teachers-panel-groups.html` - Vista principal de grupos
- ✅ `teachers-panel-group-detail.html` - Detalle de grupo
- ✅ `teachers-panel-assign-block.html` - Asignación de bloques

### Archivos de Frontend (Modificados)
- ✅ `profesores-panel-funcionalidades.html` - Añadido enlace a grupos

### Archivos de Backend (Ya pusheados)
- ✅ `playtest-backend/routes/groups.js` - 14 endpoints
- ✅ `playtest-backend/routes/blocks.js` - Control de acceso
- ✅ `playtest-backend/server.js` - Registro de rutas
- ✅ `playtest-backend/migration-add-groups-and-assignments.sql`

### Archivos de Testing
- ✅ `test-groups-system.js`
- ✅ `run-migration-groups.js`

### Documentación
- ✅ `RESUMEN_FASE2_GRUPOS_ASIGNACIONES.md`
- ✅ `GUIA_VERIFICACION_GRUPOS_ASIGNACIONES.md` (este archivo)

---

## 8. PRÓXIMOS PASOS RECOMENDADOS

1. **Panel de Alumno:**
   - Vista "Mis Grupos"
   - Vista "Bloques Asignados"
   - Función "Unirse a grupo con código"

2. **Mejoras Backend:**
   - Endpoint para listar usuarios con rol "jugador"
   - Endpoint para obtener estadísticas de progreso
   - Notificaciones en tiempo real con Socket.IO

3. **Mejoras Frontend:**
   - Añadir estudiantes directamente desde modal
   - Vista de asignaciones en tab de grupo
   - Gráficos de progreso

---

## 📞 SOPORTE

Si encuentras algún problema durante la verificación:

1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor backend
3. Consulta `RESUMEN_FASE2_GRUPOS_ASIGNACIONES.md` para detalles técnicos
4. Revisa la sección "Solución de Problemas Comunes" arriba

---

**Fecha de última actualización:** 2025-10-16
**Versión de la guía:** 1.0
**Estado del sistema:** ✅ Backend completo | 🟡 Frontend profesor completo | ⏳ Frontend alumno pendiente
