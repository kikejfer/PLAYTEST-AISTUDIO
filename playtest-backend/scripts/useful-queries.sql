-- ══════════════════════════════════════════════════════════════════════════════
-- QUERIES ÚTILES PARA CONSULTAR Y MEJORAR LA ESTRUCTURA DE BASE DE DATOS
-- ══════════════════════════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 1. INFORMACIÓN GENERAL DE TABLAS                                             │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver todas las tablas con número de columnas y tamaño
SELECT
    schemaname,
    tablename,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_name = t.tablename
       AND table_schema = t.schemaname) AS num_columns,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                   pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 2. COLUMNAS DE UNA TABLA ESPECÍFICA                                          │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver estructura completa de una tabla (reemplaza 'users' con tu tabla)
SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable,
    CASE
        WHEN column_name IN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users'
              AND tc.constraint_type = 'PRIMARY KEY'
        ) THEN '🔑 PK'
        WHEN column_name IN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users'
              AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN '🔗 FK'
        WHEN column_name IN (
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users'
              AND tc.constraint_type = 'UNIQUE'
        ) THEN '⭐ UNIQUE'
        ELSE ''
    END AS constraint_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 3. RELACIONES (FOREIGN KEYS)                                                 │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver todas las relaciones entre tablas
SELECT
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna_origen,
    ccu.table_name AS tabla_destino,
    ccu.column_name AS columna_destino,
    rc.delete_rule AS on_delete,
    rc.update_rule AS on_update
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Ver qué tablas referencian a una tabla específica (ej: users)
SELECT
    tc.table_name AS tabla_que_referencia,
    kcu.column_name AS columna_fk,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 4. ÍNDICES                                                                    │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver todos los índices con estadísticas de uso
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS numero_scans,
    idx_tup_read AS tuplas_leidas,
    idx_tup_fetch AS tuplas_obtenidas,
    pg_size_pretty(pg_relation_size(indexrelid)) AS tamaño_indice
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Índices que NUNCA se han usado (candidatos para eliminar)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS espacio_desperdiciado
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver índices duplicados o redundantes
SELECT
    tablename,
    array_agg(indexname) AS indices_similares,
    COUNT(*) AS cantidad
FROM (
    SELECT
        tablename,
        indexname,
        regexp_replace(indexdef, '.*USING [^ ]+ \((.*)\)', '\1') AS columns
    FROM pg_indexes
    WHERE schemaname = 'public'
) sub
GROUP BY tablename, columns
HAVING COUNT(*) > 1;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 5. CONSTRAINTS Y REGLAS                                                      │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver todos los constraints de una tabla
SELECT
    conname AS constraint_name,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

-- Ver todos los CHECK constraints del esquema
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 6. TRIGGERS Y FUNCIONES                                                      │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver todos los triggers
SELECT
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name,
    CASE tgtype & 2
        WHEN 0 THEN 'AFTER'
        ELSE 'BEFORE'
    END AS trigger_timing,
    CASE tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        ELSE 'MULTIPLE'
    END AS trigger_event
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE NOT tgisinternal
  AND tgrelid::regclass::text LIKE 'public.%'
ORDER BY tgrelid::regclass::text, tgname;

-- Ver definición completa de una función
SELECT
    proname AS function_name,
    pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'auto_assign_profesor_creador';

-- Listar todas las funciones
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 7. VISTAS                                                                     │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Listar todas las vistas con su definición
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Ver qué tablas base usa una vista
SELECT DISTINCT
    dependent_view.relname AS view_name,
    source_table.relname AS source_table
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class AS source_table ON pg_depend.refobjid = source_table.oid
WHERE dependent_view.relname = 'user_complete_info'
  AND source_table.relkind IN ('r', 'v');

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 8. ANÁLISIS DE RENDIMIENTO                                                   │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Tablas con más sequential scans (podrían necesitar índices)
SELECT
    schemaname,
    tablename,
    seq_scan AS num_sequential_scans,
    seq_tup_read AS tuplas_leidas_secuencialmente,
    idx_scan AS num_index_scans,
    CASE
        WHEN seq_scan = 0 THEN 0
        ELSE ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
    END AS porcentaje_uso_indices
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC
LIMIT 20;

-- Tablas con más inserts/updates/deletes (alta actividad)
SELECT
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_tup_ins + n_tup_upd + n_tup_del AS actividad_total,
    n_live_tup AS registros_actuales,
    n_dead_tup AS registros_muertos,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- Caché hit ratio (debería ser > 99%)
SELECT
    'cache_hit_ratio' AS metric,
    ROUND(
        100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)),
        2
    ) AS percentage
FROM pg_stat_database
WHERE datname = current_database();

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 9. BLOAT Y MANTENIMIENTO                                                     │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Tablas con posible bloat (registros muertos)
SELECT
    schemaname,
    tablename,
    n_dead_tup AS registros_muertos,
    n_live_tup AS registros_vivos,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS porcentaje_bloat,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 0
ORDER BY n_dead_tup DESC;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 10. SEGURIDAD Y PERMISOS                                                     │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Ver permisos en tablas
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY table_name, grantee;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 11. QUERIES DE MEJORA                                                        │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Agregar índice a columna específica
-- CREATE INDEX idx_nombre_tabla_columna ON nombre_tabla(columna);

-- Agregar columna con valor por defecto (sin bloquear tabla)
-- ALTER TABLE nombre_tabla ADD COLUMN nueva_columna tipo DEFAULT valor;

-- Agregar constraint de forma no bloqueante
-- ALTER TABLE nombre_tabla ADD CONSTRAINT nombre_constraint CHECK (condicion) NOT VALID;
-- ALTER TABLE nombre_tabla VALIDATE CONSTRAINT nombre_constraint;

-- Crear índice concurrentemente (sin bloquear lecturas/escrituras)
-- CREATE INDEX CONCURRENTLY idx_nombre ON tabla(columna);

-- Agregar columna NOT NULL de forma segura (3 pasos)
-- 1. Agregar columna nullable con default
-- ALTER TABLE tabla ADD COLUMN columna tipo DEFAULT valor;
-- 2. Actualizar valores NULL existentes
-- UPDATE tabla SET columna = valor WHERE columna IS NULL;
-- 3. Agregar constraint NOT NULL
-- ALTER TABLE tabla ALTER COLUMN columna SET NOT NULL;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 12. BÚSQUEDA EN METADATA                                                     │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Buscar tablas que contienen cierta columna
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name LIKE '%email%'
  AND table_schema = 'public'
ORDER BY table_name;

-- Buscar en nombres de tablas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%user%'
ORDER BY tablename;

-- Buscar funciones por nombre
SELECT
    proname AS function_name,
    pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE '%ticket%'
ORDER BY proname;

-- ┌──────────────────────────────────────────────────────────────────────────────┐
-- │ 13. CONTADORES Y ESTADÍSTICAS                                                │
-- └──────────────────────────────────────────────────────────────────────────────┘

-- Contar registros en todas las tablas
SELECT
    schemaname,
    tablename,
    n_live_tup AS approximate_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Cuenta exacta en una tabla (más lento pero preciso)
-- SELECT COUNT(*) FROM nombre_tabla;

-- Ver últimas estadísticas de analyze
SELECT
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_analyze DESC NULLS LAST;

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTAS:
--
-- 1. Estas queries son de solo lectura y seguras para ejecutar en producción
-- 2. Las queries de modificación (ALTER TABLE, CREATE INDEX, etc.) están
--    comentadas - descoméntalas y pruébalas primero en desarrollo
-- 3. Para índices en producción, usa CREATE INDEX CONCURRENTLY
-- 4. Siempre haz backup antes de modificaciones estructurales
-- 5. Revisa el archivo DATABASE_SCHEMA_DOCS.md para ver la estructura actual
-- ══════════════════════════════════════════════════════════════════════════════
