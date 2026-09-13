-- Add guild columns to user_characters
ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS guild_name TEXT;
ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS guild_realm TEXT;
ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS guild_region TEXT;
