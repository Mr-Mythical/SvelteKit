-- Drop the global_recents and user_favorites tables
-- Migration: Remove unused tables

-- Drop the indexes first (they should be dropped automatically with the tables, but being explicit)
DROP INDEX IF EXISTS idx_global_recents_type;
DROP INDEX IF EXISTS idx_global_recents_entity;
DROP INDEX IF EXISTS idx_global_recents_trending;
DROP INDEX IF EXISTS idx_global_recents_access_count;
DROP INDEX IF EXISTS idx_global_recents_last_accessed;

DROP INDEX IF EXISTS idx_user_favorites_user;
DROP INDEX IF EXISTS idx_user_favorites_type;
DROP INDEX IF EXISTS idx_user_favorites_user_type;
DROP INDEX IF EXISTS idx_user_favorites_unique;

-- Drop the tables
DROP TABLE IF EXISTS global_recents;
DROP TABLE IF EXISTS user_favorites;