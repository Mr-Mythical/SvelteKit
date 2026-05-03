-- Add guild_name and guild_realm columns to user_characters
ALTER TABLE user_characters ADD COLUMN guild_name TEXT;
ALTER TABLE user_characters ADD COLUMN guild_realm TEXT;
