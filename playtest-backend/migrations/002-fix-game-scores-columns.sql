-- ==========================================
-- MIGRACIÓN: Agregar columnas faltantes para endpoints de scores
-- Fecha: 2025-11-28
-- ==========================================

-- 1. Agregar columnas faltantes en game_scores
ALTER TABLE game_scores
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS score DECIMAL(5,2);

-- 2. Agregar índice para user_id en game_scores
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- 3. Agregar columna last_activity en user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Agregar índice para last_activity en user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity ON user_profiles(last_activity);

-- 5. Verificar que las columnas se agregaron correctamente
DO $$
BEGIN
    -- Verificar game_scores.user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'game_scores' AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE '✅ game_scores.user_id column exists';
    ELSE
        RAISE EXCEPTION '❌ game_scores.user_id column is missing';
    END IF;

    -- Verificar game_scores.score
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'game_scores' AND column_name = 'score'
    ) THEN
        RAISE NOTICE '✅ game_scores.score column exists';
    ELSE
        RAISE EXCEPTION '❌ game_scores.score column is missing';
    END IF;

    -- Verificar user_profiles.last_activity
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'last_activity'
    ) THEN
        RAISE NOTICE '✅ user_profiles.last_activity column exists';
    ELSE
        RAISE EXCEPTION '❌ user_profiles.last_activity column is missing';
    END IF;
END $$;
