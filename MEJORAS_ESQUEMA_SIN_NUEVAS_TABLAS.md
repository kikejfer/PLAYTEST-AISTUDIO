# Guía de Mejoras del Esquema de Base de Datos - Sin Crear Nuevas Tablas

Esta guía proporciona estrategias para mejorar y optimizar el esquema de base de datos existente **sin necesidad de crear nuevas tablas**.

---

## 📋 Tabla de Contenidos

1. [Agregar Columnas a Tablas Existentes](#1-agregar-columnas-a-tablas-existentes)
2. [Optimizar Índices](#2-optimizar-índices)
3. [Mejorar Constraints](#3-mejorar-constraints)
4. [Agregar Soft Delete](#4-agregar-soft-delete)
5. [Columnas JSONB para Flexibilidad](#5-columnas-jsonb-para-flexibilidad)
6. [Timestamps y Auditoría](#6-timestamps-y-auditoría)
7. [Triggers para Automatización](#7-triggers-para-automatización)
8. [Optimización de Tipos de Datos](#8-optimización-de-tipos-de-datos)
9. [Particionamiento Lógico](#9-particionamiento-lógico)
10. [Vistas Materializadas](#10-vistas-materializadas)

---

## 1. Agregar Columnas a Tablas Existentes

### ✅ Beneficios
- Extender funcionalidad sin crear tablas nuevas
- Mantener datos relacionados juntos
- Reducir JOINs innecesarios

### 📝 Ejemplos Prácticos

#### Agregar metadata a usuarios

```sql
-- Agregar información de última actividad
ALTER TABLE users
ADD COLUMN last_login_at TIMESTAMP,
ADD COLUMN last_ip VARCHAR(45),
ADD COLUMN login_count INTEGER DEFAULT 0;

-- Agregar información de verificación
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified_at TIMESTAMP,
ADD COLUMN phone VARCHAR(20),
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- Agregar información de configuración
ALTER TABLE users
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN language VARCHAR(10) DEFAULT 'es',
ADD COLUMN notification_preferences JSONB DEFAULT '{}';
```

#### Agregar columnas de estado a bloques

```sql
ALTER TABLE blocks
ADD COLUMN status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
ADD COLUMN published_at TIMESTAMP,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN download_count INTEGER DEFAULT 0,
ADD COLUMN average_rating DECIMAL(3,2),
ADD COLUMN tags JSONB DEFAULT '[]',
ADD COLUMN visibility VARCHAR(20) DEFAULT 'public'; -- public, private, unlisted
```

#### Agregar campos calculados a questions

```sql
ALTER TABLE questions
ADD COLUMN times_answered INTEGER DEFAULT 0,
ADD COLUMN times_correct INTEGER DEFAULT 0,
ADD COLUMN accuracy_rate DECIMAL(5,2),
ADD COLUMN average_time_seconds INTEGER,
ADD COLUMN last_used_at TIMESTAMP;
```

---

## 2. Optimizar Índices

### ✅ Beneficios
- Mejora el rendimiento de queries
- Reduce tiempo de búsqueda
- No cambia la estructura de datos

### 📝 Índices Recomendados

#### Índices para búsquedas comunes

```sql
-- Para búsquedas por email (login)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Para filtros de estado
CREATE INDEX CONCURRENTLY idx_blocks_status ON blocks(status) WHERE status != 'archived';
CREATE INDEX CONCURRENTLY idx_tickets_status ON tickets(status) WHERE status IN ('abierto', 'en_progreso');

-- Para ordenamiento por fecha
CREATE INDEX CONCURRENTLY idx_questions_created_at_desc ON questions(created_at DESC);
CREATE INDEX CONCURRENTLY idx_games_created_at_desc ON games(created_at DESC);

-- Para búsquedas por creador
CREATE INDEX CONCURRENTLY idx_blocks_creator_public ON blocks(creator_id, is_public);
```

#### Índices compuestos para queries frecuentes

```sql
-- Para buscar bloques por usuario y estado
CREATE INDEX CONCURRENTLY idx_blocks_creator_status
ON blocks(creator_id, status)
INCLUDE (name, created_at);

-- Para tickets asignados a un usuario por estado
CREATE INDEX CONCURRENTLY idx_tickets_assigned_status
ON tickets(assigned_to, status)
WHERE assigned_to IS NOT NULL;

-- Para mensajes por conversación ordenados
CREATE INDEX CONCURRENTLY idx_messages_conversation_date
ON direct_messages(conversation_id, created_at DESC);
```

#### Índices en columnas JSONB

```sql
-- Para búsquedas en campos JSONB
CREATE INDEX CONCURRENTLY idx_user_profiles_preferences
ON user_profiles USING GIN (preferences);

CREATE INDEX CONCURRENTLY idx_blocks_tags
ON blocks USING GIN (tags);

-- Índice en path específico de JSONB
CREATE INDEX CONCURRENTLY idx_game_config_type
ON games((config->>'type'))
WHERE config->>'type' IS NOT NULL;
```

---

## 3. Mejorar Constraints

### ✅ Beneficios
- Integridad de datos garantizada a nivel de BD
- Prevención de datos inválidos
- Documentación implícita de reglas de negocio

### 📝 Ejemplos de Constraints

#### Check Constraints

```sql
-- Validar email format
ALTER TABLE users
ADD CONSTRAINT users_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validar rangos de valores
ALTER TABLE questions
ADD CONSTRAINT questions_difficulty_range
CHECK (difficulty BETWEEN 1 AND 5);

ALTER TABLE user_luminarias
ADD CONSTRAINT luminarias_non_negative
CHECK (actuales >= 0 AND ganadas >= 0 AND gastadas >= 0);

-- Validar estados permitidos
ALTER TABLE tickets
ADD CONSTRAINT tickets_valid_status
CHECK (status IN ('abierto', 'en_progreso', 'esperando_respuesta', 'resuelto', 'cerrado'));

ALTER TABLE blocks
ADD CONSTRAINT blocks_valid_status
CHECK (status IN ('draft', 'published', 'archived'));

-- Validar lógica de negocio
ALTER TABLE blocks
ADD CONSTRAINT blocks_public_requires_questions
CHECK (
  (is_public = false) OR
  (is_public = true AND total_questions > 0)
);
```

#### Unique Constraints

```sql
-- Evitar duplicados
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_unique_assignment
UNIQUE (user_id, role_id);

-- Unique condicional
CREATE UNIQUE INDEX users_email_unique
ON users(LOWER(email))
WHERE email IS NOT NULL;

-- Unique compuesto
ALTER TABLE game_players
ADD CONSTRAINT game_players_unique_player_per_game
UNIQUE (game_id, user_id);
```

---

## 4. Agregar Soft Delete

### ✅ Beneficios
- Recuperar datos eliminados accidentalmente
- Mantener historial completo
- Auditoría mejorada

### 📝 Implementación

```sql
-- Agregar columna deleted_at
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE blocks ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE questions ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN deleted_at TIMESTAMP;

-- Índices para filtrar registros no eliminados
CREATE INDEX idx_users_not_deleted ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_not_deleted ON blocks(id) WHERE deleted_at IS NULL;

-- Vista para ver solo registros activos
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

CREATE VIEW active_blocks AS
SELECT * FROM blocks WHERE deleted_at IS NULL;

-- Función helper para soft delete
CREATE OR REPLACE FUNCTION soft_delete_user(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = user_id_param AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar
CREATE OR REPLACE FUNCTION restore_user(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET deleted_at = NULL
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Columnas JSONB para Flexibilidad

### ✅ Beneficios
- Agregar datos sin alterar esquema
- Flexibilidad para cambios futuros
- Ideal para configuraciones y metadatos

### 📝 Ejemplos

```sql
-- Agregar columna metadata general
ALTER TABLE blocks ADD COLUMN metadata JSONB DEFAULT '{}';
ALTER TABLE questions ADD COLUMN metadata JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT '{}';

-- Ejemplo de uso para bloques
UPDATE blocks
SET metadata = jsonb_build_object(
    'seo_description', 'Descripción para SEO',
    'featured_image', 'https://...',
    'category', 'Matemáticas',
    'subcategory', 'Álgebra',
    'difficulty_level', 'intermediate',
    'estimated_time_minutes', 30
)
WHERE id = 1;

-- Índices en campos JSONB específicos
CREATE INDEX idx_blocks_metadata_category
ON blocks((metadata->>'category'));

-- Búsqueda en JSONB
SELECT * FROM blocks
WHERE metadata->>'category' = 'Matemáticas';

-- Actualizar un campo específico en JSONB
UPDATE blocks
SET metadata = jsonb_set(metadata, '{featured_image}', '"https://nueva-url.jpg"')
WHERE id = 1;

-- Agregar campo a JSONB existente
UPDATE users
SET metadata = metadata || '{"theme": "dark"}'::jsonb
WHERE id = 1;
```

---

## 6. Timestamps y Auditoría

### ✅ Beneficios
- Rastrear cambios
- Debugging facilitado
- Análisis temporal

### 📝 Implementación

```sql
-- Agregar timestamps a tablas que no los tienen
ALTER TABLE answers
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE game_players
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Agregar columnas de auditoría
ALTER TABLE blocks
ADD COLUMN created_by INTEGER REFERENCES users(id),
ADD COLUMN updated_by INTEGER REFERENCES users(id);

ALTER TABLE questions
ADD COLUMN modified_by INTEGER REFERENCES users(id),
ADD COLUMN modification_count INTEGER DEFAULT 0;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at
    BEFORE UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Historial de cambios en JSONB
ALTER TABLE blocks
ADD COLUMN change_log JSONB DEFAULT '[]';

-- Función para registrar cambios
CREATE OR REPLACE FUNCTION log_block_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.change_log = NEW.change_log || jsonb_build_array(
            jsonb_build_object(
                'timestamp', CURRENT_TIMESTAMP,
                'user_id', NEW.updated_by,
                'action', 'update',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Triggers para Automatización

### ✅ Beneficios
- Lógica de negocio a nivel BD
- Consistencia garantizada
- Menos código en aplicación

### 📝 Ejemplos Útiles

#### Auto-actualizar contadores

```sql
-- Actualizar total_questions al agregar/eliminar
CREATE OR REPLACE FUNCTION update_block_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blocks
        SET total_questions = total_questions + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.block_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blocks
        SET total_questions = GREATEST(0, total_questions - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.block_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_block_question_count
    AFTER INSERT OR DELETE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_block_question_count();
```

#### Calcular campos derivados

```sql
-- Auto-calcular accuracy_rate
CREATE OR REPLACE FUNCTION calculate_question_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.times_answered > 0 THEN
        NEW.accuracy_rate = ROUND(
            (NEW.times_correct::DECIMAL / NEW.times_answered) * 100,
            2
        );
    ELSE
        NEW.accuracy_rate = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_question_accuracy
    BEFORE INSERT OR UPDATE OF times_answered, times_correct ON questions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_question_accuracy();
```

#### Validaciones automáticas

```sql
-- Validar que bloque público tenga preguntas
CREATE OR REPLACE FUNCTION validate_block_publication()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_public = true AND NEW.total_questions = 0 THEN
        RAISE EXCEPTION 'No se puede publicar un bloque sin preguntas';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_block_publication
    BEFORE INSERT OR UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION validate_block_publication();
```

---

## 8. Optimización de Tipos de Datos

### ✅ Beneficios
- Reducir espacio en disco
- Mejorar rendimiento
- Validación a nivel de tipo

### 📝 Mejoras Sugeridas

```sql
-- Cambiar VARCHAR sin límite a límites apropiados
ALTER TABLE users
ALTER COLUMN nickname TYPE VARCHAR(50);

-- Usar tipos más específicos
ALTER TABLE questions
ALTER COLUMN difficulty TYPE SMALLINT;

-- Usar ENUM para valores fijos (PostgreSQL)
CREATE TYPE ticket_status AS ENUM (
    'abierto',
    'en_progreso',
    'esperando_respuesta',
    'resuelto',
    'cerrado'
);

ALTER TABLE tickets
ALTER COLUMN status TYPE ticket_status USING status::ticket_status;

-- Usar tipos nativos para fechas
ALTER TABLE user_sessions
ALTER COLUMN expires_at TYPE TIMESTAMPTZ;

-- Para contadores, usar INTEGER en lugar de BIGINT si es apropiado
ALTER TABLE blocks
ALTER COLUMN view_count TYPE INTEGER;
```

---

## 9. Particionamiento Lógico

### ✅ Beneficios
- Organizar datos sin crear tablas nuevas
- Mejorar rendimiento de queries
- Facilitar mantenimiento

### 📝 Implementación con Columnas

```sql
-- Agregar columna de partición
ALTER TABLE game_scores
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP;

-- Índices parciales para particionar lógicamente
CREATE INDEX idx_games_active
ON games(created_at DESC)
WHERE status != 'finished';

CREATE INDEX idx_games_finished
ON games(finished_at DESC)
WHERE status = 'finished';

-- Vistas para diferentes particiones
CREATE VIEW recent_games AS
SELECT * FROM games
WHERE created_at > NOW() - INTERVAL '30 days';

CREATE VIEW archived_games AS
SELECT * FROM games
WHERE created_at <= NOW() - INTERVAL '30 days';
```

---

## 10. Vistas Materializadas

### ✅ Beneficios
- Queries complejas pre-calculadas
- Mejora rendimiento de lecturas
- No duplica datos reales

### 📝 Ejemplos

```sql
-- Vista materializada para dashboard
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
    (SELECT COUNT(*) FROM blocks WHERE is_public = true) AS total_public_blocks,
    (SELECT COUNT(*) FROM questions) AS total_questions,
    (SELECT COUNT(*) FROM games WHERE status = 'finished') AS total_games_completed,
    (SELECT AVG(times_answered) FROM questions) AS avg_questions_answered,
    NOW() AS last_updated;

-- Crear índice en vista materializada
CREATE INDEX ON dashboard_stats(last_updated);

-- Refrescar vista (puede hacerse periódicamente)
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Vista materializada para top usuarios
CREATE MATERIALIZED VIEW top_creators AS
SELECT
    u.id,
    u.nickname,
    COUNT(DISTINCT b.id) AS blocks_created,
    COUNT(DISTINCT q.id) AS questions_created,
    AVG(b.view_count) AS avg_block_views,
    SUM(b.view_count) AS total_views
FROM users u
LEFT JOIN blocks b ON u.id = b.creator_id AND b.deleted_at IS NULL
LEFT JOIN questions q ON b.id = q.block_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.nickname
ORDER BY total_views DESC NULLS LAST;

-- Refrescar automáticamente con trigger (en tabla de alta actividad)
CREATE OR REPLACE FUNCTION refresh_top_creators()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_creators;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Plan de Implementación Recomendado

### Fase 1: Mejoras de Rendimiento (Sin Downtime)
1. Crear índices concurrentemente
2. Analizar queries lentas y agregar índices necesarios
3. Implementar vistas materializadas para dashboards

### Fase 2: Mejoras de Integridad (Baja Prioridad de Downtime)
1. Agregar constraints CHECK
2. Agregar UNIQUE constraints donde sea necesario
3. Validar tipos de datos

### Fase 3: Nuevas Funcionalidades (Planificado)
1. Agregar columnas para soft delete
2. Implementar auditoría con timestamps
3. Agregar columnas JSONB para metadata
4. Crear triggers de automatización

### Fase 4: Optimización Continua
1. Monitorear uso de índices
2. Refrescar estadísticas regularmente
3. Revisar y actualizar vistas materializadas

---

## 📊 Herramientas de Monitoreo

```sql
-- Ver queries lentas
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Ver índices no utilizados
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver tamaño de tablas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ✅ Checklist de Mejoras

- [ ] Agregar índices en foreign keys
- [ ] Implementar soft delete en tablas principales
- [ ] Agregar columnas de auditoría (created_by, updated_by)
- [ ] Crear índices en columnas frecuentemente filtradas
- [ ] Agregar constraints CHECK para validación
- [ ] Implementar triggers para campos calculados
- [ ] Crear vistas para queries comunes
- [ ] Agregar columnas JSONB para metadata flexible
- [ ] Optimizar tipos de datos
- [ ] Documentar cambios en DATABASE_SCHEMA_DOCS.md

---

## 📚 Recursos Adicionales

- `DATABASE_SCHEMA_DOCS.md` - Documentación actual del esquema
- `playtest-backend/scripts/useful-queries.sql` - Queries útiles
- `playtest-backend/scripts/analyze-schema.js` - Script de análisis automático

---

**Nota**: Siempre prueba los cambios en un ambiente de desarrollo primero. Para cambios en producción, usa migraciones y considera el impacto en el rendimiento durante la ejecución.
