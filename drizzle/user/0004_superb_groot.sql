-- Drop existing tables (safe since Auth.js recreates them)
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;

-- Recreate accounts table with UUID ID
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Recreate sessions table with UUID ID
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL,
	"sessionToken" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Recreate indexes
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("userId");
CREATE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider","providerAccountId");
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("userId");
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("sessionToken");
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires");