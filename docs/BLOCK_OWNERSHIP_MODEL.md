# Modelo de Propiedad de Bloques en PLAYTEST

## Resumen

Este documento describe cómo se distingue la propiedad y acceso de bloques (juegos) en PLAYTEST, específicamente la diferencia entre bloques de **creadores** (marketplace público) y bloques de **profesores** (contexto de clase).

## Conceptos Clave

### 1. Dos Contextos de Bloques

PLAYTEST maneja dos tipos principales de bloques:

#### **PUBLICO** - Bloques de Marketplace
- Creados por usuarios con rol `creador` (PCC)
- Disponibles en el marketplace público
- Accesibles por cualquier jugador
- Propósito: Contenido público compartido con la comunidad

#### **CLASE** - Bloques de Profesor
- Creados por usuarios con rol `profesor` (PPF)
- Vinculados a clases específicas
- Solo accesibles por estudiantes inscritos en esas clases
- Propósito: Material educativo para clases concretas

### 2. Campo `block_scope`

La distinción entre contextos se implementa mediante el campo `block_scope` en la tabla `blocks`:

```sql
ALTER TABLE blocks
ADD COLUMN block_scope VARCHAR(20) NOT NULL DEFAULT 'PUBLICO'
CHECK (block_scope IN ('PUBLICO', 'CLASE'));
```

**Valores:**
- `'PUBLICO'`: Bloque del marketplace (creador)
- `'CLASE'`: Bloque de clase (profesor)

## Roles: ¿Jugador vs Alumno?

### Decisión de Diseño: **UN SOLO ROL "jugador"**

No se separan los roles de "jugador" y "alumno". En su lugar:

- **Rol `jugador` (PJG)**: Sirve para todos los usuarios que juegan bloques
  - Jugadores casuales del marketplace
  - Alumnos inscritos en clases

**¿Por qué no separar los roles?**
- ✅ Un alumno puede querer jugar bloques del marketplace además de los de su clase
- ✅ La distinción está en el **BLOQUE** (`block_scope`), no en el usuario
- ✅ Evita complejidad de cambios de rol
- ✅ Más flexible: un usuario puede estar en múltiples contextos simultáneamente

### Cómo se Distingue el Acceso

La distinción se hace mediante:

1. **Contexto del bloque** (`block_scope`)
2. **Asignaciones de clase** (`content_assignments`)
3. **Inscripciones de estudiantes** (`class_enrollments`)

```sql
-- Ejemplo de query de acceso:
SELECT b.*
FROM blocks b
WHERE
  -- Bloques públicos: todos pueden verlos
  (b.block_scope = 'PUBLICO' OR b.block_scope IS NULL)
  OR
  -- Bloques de clase: solo estudiantes inscritos
  (b.block_scope = 'CLASE' AND EXISTS (
    SELECT 1
    FROM content_assignments ca
    JOIN class_enrollments ce ON ce.class_id = ca.class_id
    WHERE ce.student_id = $user_id
      AND ca.block_ids @> ARRAY[b.id]
      AND ce.enrollment_status = 'active'
  ))
```

## Implementación Técnica

### 1. Creación de Bloques

Al crear un bloque, el sistema determina automáticamente el `block_scope` basándose en el rol activo del usuario:

```javascript
// En POST /api/blocks (blocks.js:1090-1100)
const actualRoleName = panelToRoleMapping[req.headers['x-current-role']];
const blockScope = (actualRoleName === 'profesor') ? 'CLASE' : 'PUBLICO';

const result = await pool.query(
  'INSERT INTO blocks (..., block_scope) VALUES (..., $10)',
  [..., blockScope]
);
```

**Lógica:**
- Si `x-current-role` = `'PPF'` (profesor) → `block_scope = 'CLASE'`
- Si `x-current-role` = `'PCC'` (creador) → `block_scope = 'PUBLICO'`
- Si `x-current-role` = `'PJG'` (jugador) → `block_scope = 'PUBLICO'`

### 2. Tracking de Propiedad

La tabla `blocks` utiliza varios campos para rastrear la propiedad:

```sql
CREATE TABLE blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Propiedad vía rol específico
  user_role_id INTEGER REFERENCES user_roles(id) NOT NULL,

  -- Contexto de visibilidad
  block_scope VARCHAR(20) NOT NULL DEFAULT 'PUBLICO',

  -- Visibilidad básica
  is_public BOOLEAN DEFAULT true,

  -- Metadata
  tipo_id INTEGER,
  nivel_id INTEGER,
  estado_id INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Asignación a Estudiantes

Los profesores asignan bloques a sus clases mediante:

```sql
-- Tabla content_assignments
CREATE TABLE content_assignments (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES teacher_classes(id),
  block_ids INTEGER[] NOT NULL,  -- Array de IDs de bloques
  assignment_type VARCHAR(50),
  assignment_name TEXT,
  due_date DATE,
  is_active BOOLEAN DEFAULT true
);
```

### 4. Acceso de Estudiantes

Los estudiantes acceden a bloques asignados a través del endpoint:

```javascript
// GET /api/students/assigned-blocks
// studentsController.js:158-203
async function getAssignedBlocks(studentId) {
  const query = `
    SELECT DISTINCT
      b.id, b.name, b.description,
      tc.class_name, u.nickname as teacher_name,
      ca.due_date, ca.assignment_name as instructions
    FROM content_assignments ca
    JOIN teacher_classes tc ON ca.class_id = tc.id
    JOIN class_enrollments ce ON ce.class_id = tc.id
    CROSS JOIN LATERAL unnest(ca.block_ids) as block_id
    JOIN blocks b ON b.id = block_id
    WHERE ce.student_id = $1
      AND ce.enrollment_status = 'active'
      AND ca.is_active = true
    ORDER BY ca.due_date ASC
  `;

  return await pool.query(query, [studentId]);
}
```

## Flujos de Uso

### Flujo 1: Creador publica bloque al marketplace

```
1. Usuario inicia sesión
2. Cambia a panel de creador (PCC)
3. Crea un bloque
   → block_scope = 'PUBLICO'
   → is_public = true
4. El bloque aparece en el marketplace
5. Cualquier jugador puede cargarlo
```

### Flujo 2: Profesor crea material para su clase

```
1. Profesor inicia sesión
2. Cambia a panel de profesor (PPF)
3. Crea un bloque
   → block_scope = 'CLASE'
   → user_role_id → rol 'profesor'
4. Asigna el bloque a una clase específica
   → content_assignments.block_ids += [block_id]
5. Solo estudiantes inscritos en esa clase pueden verlo
```

### Flujo 3: Estudiante accede a bloques

```
1. Estudiante (rol 'jugador') inicia sesión
2. Ve bloques del marketplace (block_scope = 'PUBLICO')
3. Ve bloques asignados por sus profesores
   → GET /api/students/assigned-blocks
   → Filtra por class_enrollments
4. Puede cargar y jugar ambos tipos de bloques
```

### Flujo 4: Usuario dual (profesor Y jugador)

```
1. Usuario es profesor de Matemáticas
2. También le gusta jugar bloques de Historia del marketplace
3. Contexto profesor:
   - Crea bloques de Matemáticas (block_scope = 'CLASE')
   - Los asigna a sus clases
4. Contexto jugador:
   - Juega bloques públicos de Historia (block_scope = 'PUBLICO')
   - No necesita cambiar de cuenta ni rol
```

## Ventajas de este Modelo

### 1. **Flexibilidad**
- Un usuario puede tener múltiples roles simultáneamente
- No necesita "cambiar de cuenta" para acceder a diferentes contextos

### 2. **Simplicidad**
- La lógica de acceso está en el bloque, no en el usuario
- Fácil de entender y mantener

### 3. **Escalabilidad**
- Fácil añadir nuevos contextos en el futuro (e.g., 'EMPRESA', 'OPOSICION')
- No requiere crear nuevos roles de usuario

### 4. **Privacidad**
- Bloques de clase son privados por defecto
- Solo estudiantes inscritos pueden acceder

### 5. **Reutilización**
- Un profesor puede crear un bloque como 'CLASE'
- Luego puede duplicarlo y publicarlo como 'PUBLICO' si lo desea

## Queries Comunes

### Obtener bloques visibles para un usuario

```sql
SELECT b.*
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
WHERE
  -- Bloques públicos
  (b.block_scope = 'PUBLICO' OR b.block_scope IS NULL)
  OR
  -- Bloques de clase donde el usuario está inscrito
  (
    b.block_scope = 'CLASE' AND
    EXISTS (
      SELECT 1
      FROM content_assignments ca
      JOIN class_enrollments ce ON ce.class_id = ca.class_id
      WHERE ce.student_id = $1
        AND ca.block_ids @> ARRAY[b.id]
        AND ce.enrollment_status = 'active'
    )
  )
  OR
  -- Bloques creados por el usuario (siempre visibles para el creador)
  (ur.user_id = $1)
ORDER BY b.created_at DESC;
```

### Bloques de un profesor específico para una clase

```sql
SELECT b.*
FROM blocks b
JOIN user_roles ur ON b.user_role_id = ur.id
JOIN roles r ON ur.role_id = r.id
JOIN content_assignments ca ON ca.block_ids @> ARRAY[b.id]
WHERE b.block_scope = 'CLASE'
  AND r.name = 'profesor'
  AND ur.user_id = $teacher_id
  AND ca.class_id = $class_id
  AND ca.is_active = true;
```

### Bloques del marketplace (público)

```sql
SELECT b.*
FROM blocks b
WHERE b.block_scope = 'PUBLICO'
  AND b.is_public = true
ORDER BY b.created_at DESC;
```

## Migración

Para aplicar este modelo a una base de datos existente, ejecuta:

```bash
psql $DATABASE_URL -f migrations/add-block-scope.sql
```

Este script:
1. Añade la columna `block_scope`
2. Migra datos existentes basándose en `user_role_id`
3. Crea índices para optimizar queries
4. Añade constraints de validación

## Próximos Pasos

### Posibles Mejoras Futuras

1. **Compartir bloques de clase**
   - Permitir a profesores compartir bloques entre ellos
   - Nuevo scope: `'COMPARTIDO'`

2. **Bloques de organizaciones**
   - Para empresas o instituciones
   - Scope: `'ORGANIZACION'`

3. **Analytics diferenciados**
   - Métricas específicas para bloques de clase vs marketplace
   - Tracking de progreso académico

4. **Permisos granulares**
   - Profesores colaboradores en un bloque de clase
   - Tabla `block_permissions` para gestionar accesos

---

**Última actualización:** 2025-10-29
**Versión:** 1.0
**Autor:** Sistema PLAYTEST
