# Fase 2: Implementación del Flujo de Clases

## Resumen Ejecutivo

**Fecha de implementación:** Octubre 2025
**Estado:** ✅ Frontend completado - Backend pendiente

La Fase 2 implementa el flujo completo de inscripción de jugadores a clases de profesores, diferenciando claramente entre:
- **Marketplace:** Bloques públicos de creadores (acceso libre)
- **Mis Clases:** Bloques asignados por profesores (acceso por inscripción)

---

## 🎯 Objetivos Cumplidos

### 1. Diferenciación Clara de Contextos

| Contexto | Tipo de Bloques | Acceso | Panel |
|----------|-----------------|--------|-------|
| **Marketplace** | Bloques públicos de creadores (PCC) | Libre - cualquier jugador | Tab "📚 Marketplace" |
| **Mis Clases** | Bloques asignados por profesores (PPF) | Restringido - solo alumnos inscritos | Tab "🎓 Mis Clases" |

### 2. Sistema de Inscripción a Clases

Los jugadores pueden convertirse en alumnos inscribiéndose en clases mediante:
- **Código único de clase** generado por el profesor
- Ejemplo de código: `MATH2024-A`, `HIST2024-B`

### 3. Tab Condicional "Mis Clases"

- **Oculto por defecto:** Si el jugador no está inscrito en ninguna clase
- **Se muestra automáticamente:** Cuando el jugador se inscribe en su primera clase
- **Contenido:**
  - Input para código de clase
  - Lista de clases del usuario
  - Bloques asignados por profesores

---

## 📊 Cambios Implementados

### Archivo Modificado: `jugadores-panel-gaming.html`

#### 1. Tabs Actualizados

**ANTES:**
```html
<button class="tab-button">🎮 Partidas</button>
<button class="tab-button">📚 Carga de Bloques</button>
<button class="tab-button">📊 Histórico</button>
```

**DESPUÉS:**
```html
<button class="tab-button">🎮 Partidas</button>
<button class="tab-button">📚 Marketplace</button>
<button class="tab-button" id="mis-clases-tab-button" style="display: none;">🎓 Mis Clases</button>
<button class="tab-button">📊 Histórico</button>
```

**Cambios:**
- ✅ Renombrado "Carga de Bloques" → "**Marketplace**" (claridad de contexto)
- ✅ Agregado tab "**Mis Clases**" (oculto inicialmente)

---

#### 2. Nueva Sección "Mis Clases"

```html
<div id="mis-clases-tab" class="tab-content">
    <!-- Sección 1: Inscripción -->
    <div class="section" id="enrollment-section">
        <h2>🎓 Únete a una Clase</h2>
        <input id="class-code-input" placeholder="Código de clase (ej: MATH2024-A)">
        <button onclick="enrollInClass()">Inscribirme</button>
    </div>

    <!-- Sección 2: Mis Clases -->
    <div class="section">
        <h2>📚 Mis Clases</h2>
        <div id="my-classes-container"></div>
    </div>

    <!-- Sección 3: Bloques Asignados -->
    <div class="section">
        <h2>📝 Bloques Asignados por Profesores</h2>
        <div id="assigned-blocks-container"></div>
    </div>
</div>
```

---

#### 3. Funciones JavaScript Agregadas

##### **checkUserEnrollments()** - Verificación automática

```javascript
// Se ejecuta al cargar la página
// Consulta: GET /api/students/my-classes
// Si hay clases → muestra el tab "Mis Clases"
// Si NO hay clases → oculta el tab
```

**Flujo:**
```
1. Página carga
2. checkUserEnrollments() se ejecuta
3. Llama a GET /api/students/my-classes
4. Si response.length > 0 → tab visible
5. Si response.length === 0 → tab oculto
```

---

##### **enrollInClass()** - Inscripción mediante código

```javascript
// Se ejecuta al hacer clic en "Inscribirme"
// Endpoint: POST /api/students/enroll
// Body: { class_code: "MATH2024-A" }
```

**Flujo:**
```
1. Usuario ingresa código (ej: MATH2024-A)
2. enrollInClass() valida el input
3. POST /api/students/enroll con { class_code }
4. Backend verifica código y crea inscripción
5. Frontend muestra mensaje de éxito
6. Llama a checkUserEnrollments() para mostrar tab
7. Carga loadMyClasses() y loadAssignedBlocks()
```

**Validaciones:**
- ✅ Código no vacío
- ✅ Usuario autenticado (token válido)
- ✅ Código convertido a mayúsculas automáticamente

**Respuestas:**
- ✅ Éxito: "¡Te has inscrito exitosamente en [nombre de clase]!"
- ❌ Error: "Código inválido" o "Ya estás inscrito"

---

##### **loadMyClasses()** - Listar clases del usuario

```javascript
// Endpoint: GET /api/students/my-classes
// Muestra lista de clases en las que está inscrito
```

**Datos mostrados:**
```javascript
{
    class_name: "Matemáticas Avanzadas",
    class_code: "MATH2024-A",
    subject: "Matemáticas",
    teacher_name: "Prof. García",
    grade_level: "Bachillerato",
    academic_year: "2024-2025",
    semester: "1er Semestre"
}
```

**UI generada:**
```
┌─────────────────────────────────────────┐
│ Matemáticas Avanzadas    [MATH2024-A]  │
│ Matemáticas                             │
│ Profesor: Prof. García                  │
│                                         │
│ 📚 Nivel: Bachillerato                 │
│ 📅 2024-2025                           │
│ 📊 1er Semestre                        │
└─────────────────────────────────────────┘
```

---

##### **loadAssignedBlocks()** - Bloques asignados

```javascript
// Endpoint: GET /api/students/assigned-blocks
// Muestra bloques que profesores han asignado a las clases del usuario
```

**Datos mostrados:**
```javascript
{
    block_id: 123,
    block_name: "Trigonometría Básica",
    block_description: "Funciones trigonométricas...",
    class_name: "Matemáticas Avanzadas",
    teacher_name: "Prof. García",
    questions_count: 25,
    due_date: "2024-11-15"
}
```

**UI generada:**
```
┌─────────────────────────────────────────────┐
│ Trigonometría Básica           [Cargar Bloque] │
│ Funciones trigonométricas...                   │
│ 📚 Clase: Matemáticas Avanzadas              │
│ ❓ 25 preguntas                               │
│ 👨‍🏫 Prof. García                              │
│                                                │
│ 📅 Fecha límite: 15/11/2024                  │
└─────────────────────────────────────────────┘
```

---

##### **loadBlock(blockId)** - Cargar bloque asignado

```javascript
// Endpoint: POST /api/blocks/:blockId/load
// Carga el bloque al perfil del usuario
```

**Flujo:**
```
1. Usuario hace clic en "Cargar Bloque"
2. loadBlock(123) se ejecuta
3. POST /api/blocks/123/load
4. Backend crea entrada en user_loaded_blocks
5. Frontend muestra: "✅ Bloque cargado exitosamente"
6. Refresca lista de "Bloques Cargados" (si está visible)
```

---

## 🔄 Flujo Completo de Usuario

### Escenario: Alumno inscribiéndose en clase

```
┌─────────────────────────────────────────────────┐
│ 1. PROFESOR (PPF Panel)                        │
│    - Crea clase "Matemáticas Avanzadas"       │
│    - Recibe código: MATH2024-A                 │
│    - Comparte código con alumnos               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. ALUMNO (Jugadores Panel)                   │
│    - Abre jugadores-panel-gaming.html          │
│    - Ve solo 3 tabs:                           │
│      🎮 Partidas                               │
│      📚 Marketplace                            │
│      📊 Histórico                              │
│    - NO ve "Mis Clases" (aún no inscrito)     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. INSCRIPCIÓN                                 │
│    - Alumno recibe código: MATH2024-A          │
│    - ¿Dónde inscribirse?                       │
│      Opción A: Banner en Marketplace           │
│      Opción B: Botón "Unirse a Clase" visible  │
│    - Ingresa código                            │
│    - Clic en "Inscribirme"                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. BACKEND PROCESA                             │
│    - POST /api/students/enroll                 │
│    - Valida código MATH2024-A                  │
│    - Inserta en class_enrollments:             │
│      {                                         │
│        class_id: 5,                            │
│        student_id: 42,                         │
│        enrollment_status: 'active'             │
│      }                                         │
│    - Retorna: { success: true,                 │
│                 class_name: "Matemáticas..." }  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. FRONTEND ACTUALIZA                          │
│    - Muestra: "✅ Inscrito en Matemáticas..."  │
│    - Llama checkUserEnrollments()              │
│    - Tab "🎓 Mis Clases" ahora VISIBLE         │
│    - Carga loadMyClasses()                     │
│    - Carga loadAssignedBlocks()                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. ALUMNO VE CONTENIDO                         │
│    - Ahora ve 4 tabs:                          │
│      🎮 Partidas                               │
│      📚 Marketplace (bloques públicos)         │
│      🎓 Mis Clases (bloques asignados) ← NUEVO │
│      📊 Histórico                              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 7. PROFESOR ASIGNA BLOQUE                      │
│    - Desde PPF panel                           │
│    - Selecciona clase "Matemáticas Avanzadas"  │
│    - Asigna bloque "Trigonometría Básica"      │
│    - Establece fecha límite: 15/11/2024        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 8. ALUMNO VE BLOQUE ASIGNADO                   │
│    - Abre tab "Mis Clases"                     │
│    - Ve en "Bloques Asignados":                │
│      - Trigonometría Básica                    │
│      - 📅 Fecha límite: 15/11/2024             │
│      - [Botón: Cargar Bloque]                  │
│    - Hace clic en "Cargar Bloque"              │
│    - Bloque se carga a su perfil               │
│    - Puede jugar desde "Partidas"              │
└─────────────────────────────────────────────────┘
```

---

## 🗃️ Endpoints de Backend Necesarios

### 1. GET `/api/students/my-classes`

**Descripción:** Obtener clases en las que el usuario está inscrito

**Headers:**
```javascript
{
    'Authorization': 'Bearer {token}',
    'X-Current-Role': 'PJG'
}
```

**Query de BD:**
```sql
SELECT
    tc.id,
    tc.class_name,
    tc.class_code,
    tc.subject,
    tc.grade_level,
    tc.academic_year,
    tc.semester,
    u.nickname as teacher_name
FROM class_enrollments ce
JOIN teacher_classes tc ON ce.class_id = tc.id
JOIN users u ON tc.teacher_id = u.id
WHERE ce.student_id = $userId
  AND ce.enrollment_status = 'active'
  AND tc.is_active = true
ORDER BY tc.created_at DESC;
```

**Response:**
```json
[
    {
        "id": 5,
        "class_name": "Matemáticas Avanzadas",
        "class_code": "MATH2024-A",
        "subject": "Matemáticas",
        "grade_level": "Bachillerato",
        "academic_year": "2024-2025",
        "semester": "1er Semestre",
        "teacher_name": "Prof. García"
    }
]
```

---

### 2. POST `/api/students/enroll`

**Descripción:** Inscribirse en una clase mediante código

**Headers:**
```javascript
{
    'Authorization': 'Bearer {token}',
    'X-Current-Role': 'PJG',
    'Content-Type': 'application/json'
}
```

**Body:**
```json
{
    "class_code": "MATH2024-A"
}
```

**Validaciones:**
```
1. Código existe y está activo
2. Usuario no está ya inscrito
3. Clase no ha alcanzado max_students
4. Clase no ha finalizado (end_date)
```

**Query de BD:**
```sql
-- Buscar clase
SELECT id, class_name, max_students
FROM teacher_classes
WHERE class_code = $classCode
  AND is_active = true
  AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- Verificar no duplicado
SELECT id FROM class_enrollments
WHERE class_id = $classId AND student_id = $userId;

-- Insertar inscripción
INSERT INTO class_enrollments (class_id, student_id, enrollment_status)
VALUES ($classId, $userId, 'active')
RETURNING *;
```

**Response Exitoso:**
```json
{
    "success": true,
    "message": "Inscripción exitosa",
    "class_name": "Matemáticas Avanzadas",
    "class_code": "MATH2024-A"
}
```

**Response Error:**
```json
{
    "error": "Código de clase inválido"
}
// O
{
    "error": "Ya estás inscrito en esta clase"
}
```

---

### 3. GET `/api/students/assigned-blocks`

**Descripción:** Obtener bloques asignados a las clases del usuario

**Headers:**
```javascript
{
    'Authorization': 'Bearer {token}',
    'X-Current-Role': 'PJG'
}
```

**Query de BD:**
```sql
SELECT DISTINCT
    b.id as block_id,
    b.name as block_name,
    b.description as block_description,
    tc.class_name,
    u.nickname as teacher_name,
    ca.due_date,
    (SELECT COUNT(*) FROM questions WHERE block_id = b.id) as questions_count
FROM content_assignments ca
JOIN teacher_classes tc ON ca.class_id = tc.id
JOIN blocks b ON ca.block_id = b.id
JOIN users u ON tc.teacher_id = u.id
JOIN class_enrollments ce ON ce.class_id = tc.id
WHERE ce.student_id = $userId
  AND ce.enrollment_status = 'active'
  AND ca.is_active = true
ORDER BY ca.due_date ASC NULLS LAST;
```

**Response:**
```json
[
    {
        "block_id": 123,
        "block_name": "Trigonometría Básica",
        "block_description": "Funciones trigonométricas fundamentales",
        "class_name": "Matemáticas Avanzadas",
        "teacher_name": "Prof. García",
        "questions_count": 25,
        "due_date": "2024-11-15T00:00:00.000Z"
    }
]
```

---

### 4. POST `/api/blocks/:blockId/load`

**Descripción:** Cargar un bloque al perfil del usuario

**Headers:**
```javascript
{
    'Authorization': 'Bearer {token}',
    'X-Current-Role': 'PJG'
}
```

**Query de BD:**
```sql
-- Verificar que el bloque existe
SELECT id FROM blocks WHERE id = $blockId;

-- Insertar en user_loaded_blocks (si no existe)
INSERT INTO user_loaded_blocks (user_id, block_id, loaded_at)
VALUES ($userId, $blockId, NOW())
ON CONFLICT (user_id, block_id) DO NOTHING
RETURNING *;
```

**Response:**
```json
{
    "success": true,
    "message": "Bloque cargado exitosamente"
}
```

---

## 🎨 Diferencias Visuales

### Tab "Marketplace" (antes "Carga de Bloques")

**Contenido:**
- Bloques públicos de **cualquier creador**
- **Acceso libre** - cualquier jugador puede cargar
- No requiere inscripción
- Bloques creados por **PCC (Creadores)**

**Label cambió:**
- ANTES: "📚 Carga de Bloques"
- AHORA: "📚 Marketplace"

---

### Tab "Mis Clases" (NUEVO)

**Contenido:**
- Bloques asignados por **profesores específicos**
- **Acceso restringido** - solo alumnos inscritos
- Requiere código de inscripción
- Bloques creados por **PPF (Profesores)**

**Visibilidad:**
- OCULTO si no hay inscripciones
- VISIBLE si hay al menos 1 clase

**Secciones:**
1. **Inscripción:** Input de código + botón
2. **Mis Clases:** Lista de clases inscritas
3. **Bloques Asignados:** Lista de bloques con fechas límite

---

## 📋 Checklist de Implementación

### Frontend ✅ COMPLETADO

- [x] Renombrar "Carga de Bloques" → "Marketplace"
- [x] Agregar tab "Mis Clases" (oculto por defecto)
- [x] Crear UI de inscripción con input de código
- [x] Implementar `checkUserEnrollments()`
- [x] Implementar `enrollInClass()`
- [x] Implementar `loadMyClasses()`
- [x] Implementar `loadAssignedBlocks()`
- [x] Implementar `loadBlock()`
- [x] Agregar inicialización automática en DOMContentLoaded

### Backend ⏳ PENDIENTE

- [ ] Endpoint: GET `/api/students/my-classes`
- [ ] Endpoint: POST `/api/students/enroll`
- [ ] Endpoint: GET `/api/students/assigned-blocks`
- [ ] Endpoint: POST `/api/blocks/:blockId/load`
- [ ] Middleware de validación de rol PJG
- [ ] Query para verificar códigos de clase
- [ ] Query para prevenir inscripciones duplicadas
- [ ] Índices en `class_enrollments` para performance

---

## 🔗 Integración con Fase 1

La Fase 2 construye sobre la Fase 1:

| Aspecto | Fase 1 | Fase 2 |
|---------|--------|--------|
| **Terminología PPF** | "Alumnos" en panel | "Mis Clases" usa misma terminología |
| **Terminología PCC** | "Jugadores" en panel | "Marketplace" para jugadores libres |
| **Componentes** | bloques-creados-component.js | Reutiliza userType: 'estudiantes' para alumnos |
| **Contextos** | Diferenciados en headers | Diferenciados en tabs del jugador |

---

## 🚀 Próximos Pasos (Fase 3)

1. **Implementar Backend:**
   - Crear los 4 endpoints documentados
   - Agregar validaciones de negocio
   - Tests unitarios y de integración

2. **Sistema de Asignaciones (PPF):**
   - UI para asignar bloques a clases
   - Establecer fechas límite
   - Tracking de completitud por alumno

3. **Dashboard de Progreso (PPF):**
   - Ver progreso de alumnos en bloques asignados
   - Métricas de rendimiento por clase
   - Alertas de fechas límite próximas

4. **Notificaciones:**
   - Alertar a alumnos de nuevos bloques asignados
   - Recordatorios de fechas límite
   - Notificaciones de progreso al profesor

---

**Documento creado:** Octubre 2025
**Última actualización:** Fase 2 frontend completada
**Próxima revisión:** Implementación backend
