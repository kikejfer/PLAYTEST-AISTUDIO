-- Migration: Add user_id and score columns to game_scores table
-- Date: 2025-11-05
-- Description: The game_scores table needs user_id and score columns to properly track individual scores

-- Step 1: Add user_id column (nullable initially to allow migration of existing data)
ALTER TABLE game_scores
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Step 2: Add score column with default value
ALTER TABLE game_scores
ADD COLUMN IF NOT EXISTS score NUMERIC(5,2) DEFAULT 0;

-- Step 3: Populate user_id for existing records using game_players
-- This assumes each game has at least one player
UPDATE game_scores gs
SET user_id = (
  SELECT gp.user_id
  FROM game_players gp
  WHERE gp.game_id = gs.game_id
  LIMIT 1
)
WHERE user_id IS NULL;

-- Step 4: Populate score for existing records from score_data JSONB
-- Extract the numeric score from score_data->>'score'
UPDATE game_scores
SET score = COALESCE((score_data->>'score')::numeric, 0)
WHERE score = 0 OR score IS NULL;

-- Step 5: Make user_id NOT NULL now that it's populated
ALTER TABLE game_scores
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Add foreign key constraint for user_id
ALTER TABLE game_scores
ADD CONSTRAINT fk_game_scores_user_id
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Step 7: Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- Step 8: Add composite unique constraint to prevent duplicate scores per game per user
-- First, check if there are duplicates and keep only the most recent one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY game_id, user_id ORDER BY created_at DESC) as rn
  FROM game_scores
)
DELETE FROM game_scores
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE game_scores
DROP CONSTRAINT IF EXISTS unique_game_user_score;

ALTER TABLE game_scores
ADD CONSTRAINT unique_game_user_score
UNIQUE (game_id, user_id);

-- Verification queries (comment out for production, uncomment to verify)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'game_scores'
-- ORDER BY ordinal_position;

-- SELECT COUNT(*) as total_scores,
--        COUNT(DISTINCT user_id) as unique_users,
--        COUNT(DISTINCT game_id) as unique_games
-- FROM game_scores;

COMMIT;
