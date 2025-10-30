-- Test Queries for New Blocks Table Structure
-- Tests the restructured blocks table that uses user_role_id instead of creator_id

-- ==================== VERIFICATION QUERIES ====================

-- 1. Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blocks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected columns: id, name, description, user_role_id, is_public, created_at, updated_at, image_url, observaciones

-- 2. Check if creator_id column was properly removed
SELECT COUNT(*) as old_creator_id_exists
FROM information_schema.columns 
WHERE table_name = 'blocks' AND column_name = 'creator_id' AND table_schema = 'public';
-- Should return 0

-- 3. Verify user_role_id references are valid
SELECT b.id, b.name, b.user_role_id, ur.id as user_role_exists
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
WHERE ur.id IS NULL;
-- Should return no rows (all user_role_ids should be valid)

-- ==================== FUNCTIONAL QUERIES ====================

-- 4. Get all blocks with creator information (replaces old creator_id queries)
SELECT 
    b.id,
    b.name,
    b.description,
    b.observaciones,
    b.is_public,
    b.created_at,
    u.id as creator_id,
    u.nickname as creator_nickname,
    r.name as created_with_role
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY b.created_at DESC
LIMIT 10;

-- 5. Get blocks created by specific user (replaces WHERE creator_id = X)
SELECT 
    b.id,
    b.name,
    r.name as role_used
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = 1 -- Replace with actual user ID
ORDER BY b.created_at DESC;

-- 6. Get blocks by specific user and role combination
SELECT 
    b.id,
    b.name,
    u.nickname,
    r.name as role_name
FROM blocks b
JOIN user_roles ur ON b.user_role_id = ur.id
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.nickname = 'testuser' AND r.name = 'creador_contenido';

-- 7. Check ownership for block modification (replaces creator_id check)
SELECT 
    b.id,
    u.id as owner_user_id,
    u.nickname as owner_nickname,
    r.name as creation_role
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE b.id = 1; -- Replace with actual block ID

-- ==================== PERFORMANCE QUERIES ====================

-- 8. Test query performance with indexes
EXPLAIN ANALYZE
SELECT 
    b.id,
    b.name,
    u.nickname,
    r.name
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE b.is_public = true
ORDER BY b.created_at DESC
LIMIT 20;

-- 9. Check index usage for user_role_id
EXPLAIN ANALYZE
SELECT * FROM blocks WHERE user_role_id = 1;

-- ==================== DATA INTEGRITY TESTS ====================

-- 10. Count blocks per user (should match old creator_id counts)
SELECT 
    u.id as user_id,
    u.nickname,
    COUNT(b.id) as blocks_created
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN blocks b ON ur.id = b.user_role_id
GROUP BY u.id, u.nickname
ORDER BY blocks_created DESC;

-- 11. Count blocks per role
SELECT 
    r.name as role_name,
    COUNT(b.id) as blocks_created
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
LEFT JOIN blocks b ON ur.id = b.user_role_id
GROUP BY r.name
ORDER BY blocks_created DESC;

-- 12. Verify no orphaned blocks exist
SELECT 
    b.id,
    b.name,
    b.user_role_id,
    CASE 
        WHEN ur.id IS NULL THEN 'ORPHANED - Invalid user_role_id'
        WHEN u.id IS NULL THEN 'ORPHANED - User deleted'
        WHEN r.id IS NULL THEN 'ORPHANED - Role deleted'
        ELSE 'OK'
    END as status
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE ur.id IS NULL OR u.id IS NULL OR r.id IS NULL;
-- Should return no rows

-- ==================== COMPATIBILITY VIEW TEST ====================

-- 13. Test the blocks_with_stats view (provides creator_id for compatibility)
SELECT 
    id,
    name,
    creator_id, -- This should work via the view
    creator_nickname,
    created_with_role,
    question_count
FROM blocks_with_stats
ORDER BY created_at DESC
LIMIT 5;

-- ==================== BLOCK CREATION SIMULATION ====================

-- 14. Simulate block creation process (find user's active role)
-- This mimics what the API does when creating a block
SELECT 
    ur.id as user_role_record_id,
    u.nickname,
    r.name as role_name,
    CASE 
        WHEN r.name = 'administrador_principal' THEN 1
        WHEN r.name = 'administrador_secundario' THEN 2
        WHEN r.name = 'creador_contenido' THEN 3
        WHEN r.name = 'profesor' THEN 4
        ELSE 5 
    END as role_priority
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.nickname = 'testuser' -- Replace with actual username
ORDER BY role_priority
LIMIT 1;

-- 15. Test block creation with specific user_role_id
-- INSERT INTO blocks (name, description, user_role_id, is_public, observaciones)
-- VALUES ('Test Block', 'Testing new structure', 1, true, 'Created with new structure');
-- Note: Uncomment and adjust user_role_id as needed for actual testing

-- ==================== MIGRATION VERIFICATION ====================

-- 16. If migrating from old structure, verify data preservation
-- Compare old vs new structure results (run if you have backup of old data)
/*
-- This query would verify that migrated data matches original creator relationships
SELECT 
    'New Structure' as source,
    u.nickname,
    COUNT(b.id) as block_count
FROM blocks b
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
GROUP BY u.nickname

UNION ALL

SELECT 
    'Old Structure' as source,
    u.nickname,
    COUNT(b_old.id) as block_count
FROM blocks_backup b_old -- Assuming you have a backup table
LEFT JOIN users u ON b_old.creator_id = u.id
GROUP BY u.nickname

ORDER BY source, nickname;
*/

-- ==================== CLEANUP VERIFICATION ====================

-- 17. Ensure old creator_id indexes are removed
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'blocks' AND indexname LIKE '%creator_id%';
-- Should return no rows

-- 18. Verify new user_role_id index exists
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'blocks' AND indexname LIKE '%user_role_id%';
-- Should return the idx_blocks_user_role_id index

COMMENT ON COLUMN blocks.user_role_id IS 'References user_roles(id) - identifies which user-role combination created this block, eliminating redundancy with separate creator_id field';