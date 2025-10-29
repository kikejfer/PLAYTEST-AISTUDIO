-- Add metadata columns to blocks table
-- These columns link blocks to their type, level, and state metadata

-- Add tipo_id column (references block_types)
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS tipo_id INTEGER REFERENCES block_types(id) ON DELETE SET NULL;

-- Add nivel_id column (references block_levels)
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS nivel_id INTEGER REFERENCES block_levels(id) ON DELETE SET NULL;

-- Add estado_id column (references block_states)
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS estado_id INTEGER REFERENCES block_states(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocks_tipo_id ON blocks(tipo_id);
CREATE INDEX IF NOT EXISTS idx_blocks_nivel_id ON blocks(nivel_id);
CREATE INDEX IF NOT EXISTS idx_blocks_estado_id ON blocks(estado_id);

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully';
    RAISE NOTICE '   - Added tipo_id column to blocks table';
    RAISE NOTICE '   - Added nivel_id column to blocks table';
    RAISE NOTICE '   - Added estado_id column to blocks table';
    RAISE NOTICE '   - Created indexes for better query performance';
END $$;
