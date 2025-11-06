# Migración a Modelo de Oposiciones

## 📋 Descripción

Esta migración transforma el panel de profesor del modelo académico tradicional al modelo de oposiciones, optimizado para preparación de exámenes de oposiciones.

## 🔄 Cambios Principales

### Tablas Renombradas
- `teacher_classes` → `oposiciones`
  - `class_name` → `nombre_oposicion`
  - `class_code` → `codigo_acceso`
  - `subject` → `descripcion`
  - `teacher_id` → `profesor_id`

### Campos Eliminados (innecesarios para oposiciones)
- `semester`, `class_room`, `max_students`, `current_students`
- `meeting_schedule`, `grade_level`, `curriculum_standards`
- `learning_objectives`, `assessment_criteria`

### Nuevas Tablas
1. **`bloques_temas`** - Bloques de contenido (ej: "Derecho Constitucional")
2. **`temas`** - Temas dentro de cada bloque (ej: "Título Preliminar")
3. **`cronograma_alumno`** - Cronograma personalizado por alumno
4. **`cronograma_bloques`** - Cronograma de bloques por alumno
5. **`comentarios_profesor`** - Comentarios del profesor por bloque/alumno
6. **`dominio_preguntas`** - Rastrea dominio de preguntas por alumno

### Tablas Eliminadas (respaldadas)
- `attendance_tracking` → Respaldada en `_backup_attendance_tracking`
- `pedagogical_interventions` → Respaldada en `_backup_pedagogical_interventions`

## 🚀 Ejecución de la Migración

### Opción 1: PostgreSQL (psql)

```bash
# Conectar a la base de datos
psql "postgresql://usuario:password@host:port/database?sslmode=require"

# Ejecutar migración
\i playtest-backend/migrations/reorganize-to-oposiciones-model.sql
```

### Opción 2: pgAdmin

1. Abrir pgAdmin y conectar a la base de datos
2. Ir a Tools → Query Tool
3. Abrir el archivo `reorganize-to-oposiciones-model.sql`
4. Ejecutar (F5 o botón "Execute")

### Opción 3: Node.js Script

```bash
# Desde playtest-backend/
node scripts/run-migration.js
```

## ⚠️ IMPORTANTE - Antes de Ejecutar

1. **Crear respaldo completo de la base de datos:**
   ```bash
   pg_dump "postgresql://user:pass@host:port/db" > backup_$(date +%Y%m%d).sql
   ```

2. **Verificar conexión:**
   ```bash
   psql "postgresql://..." -c "SELECT NOW();"
   ```

3. **Revisar tablas existentes:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

## 📊 Verificación Post-Migración

Después de ejecutar la migración, verificar:

```sql
-- 1. Verificar que las tablas fueron creadas
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('oposiciones', 'bloques_temas', 'temas', 'cronograma_alumno', 'cronograma_bloques', 'comentarios_profesor', 'dominio_preguntas')
ORDER BY table_name;

-- 2. Verificar datos migrados
SELECT COUNT(*) as total_oposiciones FROM oposiciones;
SELECT COUNT(*) as inscripciones FROM class_enrollments;

-- 3. Verificar respaldos
SELECT COUNT(*) as backup_attendance FROM _backup_attendance_tracking;
SELECT COUNT(*) as backup_interventions FROM _backup_pedagogical_interventions;

-- 4. Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename IN ('oposiciones', 'bloques_temas', 'temas')
ORDER BY tablename, indexname;

-- 5. Probar funciones
SELECT calcular_total_preguntas_bloque(1); -- Si existe bloque con id 1
```

## 🔧 Funciones Creadas

### `calcular_total_preguntas_bloque(bloque_id)`
Calcula y actualiza el total de preguntas de un bloque.

```sql
SELECT calcular_total_preguntas_bloque(1);
```

### `calcular_total_preguntas_tema(tema_id)`
Calcula y actualiza el total de preguntas de un tema.

```sql
SELECT calcular_total_preguntas_tema(1);
```

### `generar_cronograma_alumno(alumno_id, oposicion_id, fecha_objetivo)`
Genera automáticamente el cronograma personalizado para un alumno.

```sql
SELECT generar_cronograma_alumno(123, 1, '2025-06-15'::DATE);
```

### `actualizar_dominio_pregunta(alumno_id, pregunta_id, fue_correcta)`
Actualiza el dominio de una pregunta cuando el alumno la responde.

```sql
SELECT actualizar_dominio_pregunta(123, 456, true);
```

## 🔄 Rollback (en caso de error)

Si necesitas revertir la migración:

```sql
BEGIN;

-- Restaurar tablas respaldadas
DROP TABLE IF EXISTS attendance_tracking CASCADE;
DROP TABLE IF EXISTS pedagogical_interventions CASCADE;
ALTER TABLE _backup_attendance_tracking RENAME TO attendance_tracking;
ALTER TABLE _backup_pedagogical_interventions RENAME TO pedagogical_interventions;

-- Renombrar oposiciones de vuelta a teacher_classes
ALTER TABLE oposiciones RENAME TO teacher_classes;
ALTER TABLE teacher_classes RENAME COLUMN nombre_oposicion TO class_name;
ALTER TABLE teacher_classes RENAME COLUMN codigo_acceso TO class_code;
ALTER TABLE teacher_classes RENAME COLUMN descripcion TO subject;
ALTER TABLE teacher_classes RENAME COLUMN profesor_id TO teacher_id;

-- Eliminar nuevas tablas
DROP TABLE IF EXISTS dominio_preguntas CASCADE;
DROP TABLE IF EXISTS comentarios_profesor CASCADE;
DROP TABLE IF EXISTS cronograma_bloques CASCADE;
DROP TABLE IF EXISTS cronograma_alumno CASCADE;
DROP TABLE IF EXISTS temas CASCADE;
DROP TABLE IF EXISTS bloques_temas CASCADE;

-- Restaurar class_enrollments
ALTER TABLE class_enrollments RENAME COLUMN oposicion_id TO class_id;
ALTER TABLE class_enrollments RENAME COLUMN alumno_id TO student_id;

COMMIT;
```

## 📝 Siguientes Pasos

Después de ejecutar la migración exitosamente:

1. **Actualizar código backend:**
   - Actualizar controladores y rutas
   - Modificar queries SQL
   - Actualizar modelos de datos

2. **Actualizar código frontend:**
   - Reorganizar panel de profesor
   - Actualizar panel de alumno
   - Implementar cronograma visual

3. **Poblar datos de prueba:**
   - Crear oposiciones de ejemplo
   - Crear bloques y temas
   - Generar cronogramas de prueba

## 📞 Soporte

En caso de problemas durante la migración:
1. Revisar logs de PostgreSQL
2. Verificar respaldos
3. Consultar mensajes de RAISE NOTICE
4. Revisar constraints y foreign keys

## 🎯 Modelo de Datos Final

```
OPOSICIÓN
  └── BLOQUES DE TEMAS
       └── TEMAS
            └── PREGUNTAS

ALUMNO
  └── CRONOGRAMA (por oposición)
       └── CRONOGRAMA DE BLOQUES
            ├── Fechas previstas
            ├── Fechas reales
            └── Progreso
```
