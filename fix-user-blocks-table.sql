-- Fix for missing user_blocks table
-- Run this in your PostgreSQL database (playtest_db_xgme)

-- Create the missing user_blocks table
CREATE TABLE user_blocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, block_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_blocks_user_id ON user_blocks(user_id);
CREATE INDEX idx_user_blocks_block_id ON user_blocks(block_id);

-- Optional: Migrate existing data from user_profiles.loaded_blocks to user_blocks table
-- (Run this only if you have existing data in user_profiles.loaded_blocks)
/*
INSERT INTO user_blocks (user_id, block_id)
SELECT 
    up.user_id,
    block_id::INTEGER
FROM user_profiles up,
LATERAL jsonb_array_elements_text(up.loaded_blocks) AS block_id
WHERE up.loaded_blocks IS NOT NULL 
AND jsonb_array_length(up.loaded_blocks) > 0;
*/

-- Verify the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_blocks';