# Migración de Base de Datos: Añadir user_id y score a game_scores

## Problema
La tabla `game_scores` no tiene las columnas `user_id` y `score` que el código necesita, causando error 500 al guardar puntuaciones.

## Solución
Ejecutar la migración SQL para añadir las columnas faltantes.

## Cómo ejecutar la migración en Render

### Opción 1: Desde la consola web de Render (PostgreSQL)

1. Ve a tu Dashboard de Render
2. Selecciona tu base de datos PostgreSQL
3. Click en "Shell" o "Connect"
4. Copia y pega el contenido del archivo `add_user_id_score_to_game_scores.sql`
5. Ejecuta el script

### Opción 2: Usando psql desde terminal local

```bash
# Obtén la DATABASE_URL de Render (Settings -> Environment Variables)
psql "postgresql://user:password@host:port/database" < playtest-backend/migrations/add_user_id_score_to_game_scores.sql
```

### Opción 3: Ejecución paso a paso (recomendado si tienes dudas)

Ejecuta cada comando uno por uno en el shell de PostgreSQL:

```sql
-- 1. Añadir columna user_id (nullable)
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- 2. Añadir columna score con default
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0;

-- 3. Rellenar user_id de registros existentes
UPDATE game_scores gs
SET user_id = (
  SELECT gp.user_id FROM game_players gp
  WHERE gp.game_id = gs.game_id LIMIT 1
)
WHERE user_id IS NULL;

-- 4. Rellenar score de registros existentes
UPDATE game_scores
SET score = COALESCE((score_data->>'score')::numeric, 0)
WHERE score = 0 OR score IS NULL;

-- 5. Hacer user_id NOT NULL
ALTER TABLE game_scores ALTER COLUMN user_id SET NOT NULL;

-- 6. Añadir foreign key constraint
ALTER TABLE game_scores
ADD CONSTRAINT fk_game_scores_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Añadir índice
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- 8. Eliminar duplicados si existen
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY game_id, user_id ORDER BY created_at DESC) as rn
  FROM game_scores
)
DELETE FROM game_scores WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 9. Añadir constraint unique
ALTER TABLE game_scores
ADD CONSTRAINT unique_game_user_score UNIQUE (game_id, user_id);
```

## Verificación

Después de ejecutar la migración, verifica que todo está correcto:

```sql
-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_scores'
ORDER BY ordinal_position;

-- Verificar datos
SELECT COUNT(*) as total_scores,
       COUNT(DISTINCT user_id) as unique_users,
       COUNT(DISTINCT game_id) as unique_games
FROM game_scores;

-- Ver un ejemplo de registro
SELECT * FROM game_scores LIMIT 1;
```

Deberías ver columnas:
- `id` (integer)
- `game_id` (integer)
- `game_type` (character varying)
- `score_data` (jsonb)
- `created_at` (timestamp)
- `user_id` (integer) ← **NUEVA**
- `score` (numeric) ← **NUEVA**

## Después de la migración

Una vez ejecutada la migración exitosamente:
1. Los nuevos scores se guardarán correctamente con user_id y score
2. El error 500 desaparecerá
3. Las puntuaciones se mostrarán en el historial correctamente

## Rollback (si algo sale mal)

Si necesitas revertir la migración:

```sql
-- CUIDADO: Esto elimina las columnas añadidas
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS unique_game_user_score;
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS fk_game_scores_user_id;
DROP INDEX IF EXISTS idx_game_scores_user_id;
ALTER TABLE game_scores DROP COLUMN IF EXISTS user_id;
ALTER TABLE game_scores DROP COLUMN IF EXISTS score;
```

## Notas importantes

⚠️ **Backup**: Antes de ejecutar cualquier migración en producción, haz un backup de la base de datos desde Render.

⚠️ **Downtime**: Esta migración puede tomar unos segundos dependiendo del número de registros en `game_scores`. Durante ese tiempo, los usuarios no podrán guardar puntuaciones nuevas.

⚠️ **Duplicados**: Si hay múltiples scores por game_id + user_id, solo se mantendrá el más reciente.
