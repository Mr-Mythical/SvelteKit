-- Fix email column to be nullable for Battle.net OAuth
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;