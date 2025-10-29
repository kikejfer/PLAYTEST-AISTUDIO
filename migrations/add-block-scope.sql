-- Migration: Add block_scope column to blocks table
-- Purpose: Distinguish between public marketplace blocks (PUBLICO) and class-specific blocks (CLASE)
-- Created: 2025-10-29

-- 1. Add block_scope column with default value
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS block_scope VARCHAR(20) DEFAULT 'PUBLICO';

-- 2. Add check constraint to ensure valid values
ALTER TABLE blocks
ADD CONSTRAINT check_block_scope
CHECK (block_scope IN ('PUBLICO', 'CLASE'));

-- 3. Update existing blocks based on their user_role_id context
-- Blocks created by 'profesor' role should be 'CLASE'
-- All others should be 'PUBLICO'
UPDATE blocks b
SET block_scope = CASE
    WHEN r.name = 'profesor' THEN 'CLASE'
    ELSE 'PUBLICO'
END
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE b.user_role_id = ur.id
  AND b.block_scope IS NULL;

-- 4. Set NOT NULL constraint after data migration
ALTER TABLE blocks
ALTER COLUMN block_scope SET NOT NULL;

-- 5. Add comment to document the field
COMMENT ON COLUMN blocks.block_scope IS
'Scope of block visibility: PUBLICO (marketplace, accessible to all) or CLASE (class-specific, only for enrolled students)';

-- 6. Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_blocks_block_scope ON blocks(block_scope);

-- 7. Create composite index for common query pattern (scope + is_public)
CREATE INDEX IF NOT EXISTS idx_blocks_scope_public ON blocks(block_scope, is_public) WHERE is_public = true;

-- Verification query
DO $$
DECLARE
    publico_count INTEGER;
    clase_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO publico_count FROM blocks WHERE block_scope = 'PUBLICO';
    SELECT COUNT(*) INTO clase_count FROM blocks WHERE block_scope = 'CLASE';

    RAISE NOTICE '✅ Migration completed successfully:';
    RAISE NOTICE '   - PUBLICO blocks: %', publico_count;
    RAISE NOTICE '   - CLASE blocks: %', clase_count;
    RAISE NOTICE '   - Total: %', (publico_count + clase_count);
END $$;
