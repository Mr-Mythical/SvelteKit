CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "global_recents" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_data" jsonb NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"metadata" jsonb DEFAULT '{}',
	"access_count" integer DEFAULT 1 NOT NULL,
	"unique_users_count" integer DEFAULT 1 NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"trending_score" integer DEFAULT 0 NOT NULL,
	"last_trending_update" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	"session_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_data" jsonb NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_recents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_data" jsonb NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"metadata" jsonb DEFAULT '{}',
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"battletag" varchar(50) NOT NULL,
	"email" text,
	"name" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"preferences" jsonb DEFAULT '{}',
	"battlenet_access_token" text,
	"battlenet_refresh_token" text,
	"battlenet_expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recents" ADD CONSTRAINT "user_recents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_global_recents_type" ON "global_recents" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_global_recents_entity" ON "global_recents" USING btree ("type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_global_recents_trending" ON "global_recents" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "idx_global_recents_access_count" ON "global_recents" USING btree ("access_count");--> statement-breakpoint
CREATE INDEX "idx_global_recents_last_accessed" ON "global_recents" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_user" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_type" ON "user_favorites" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_user_type" ON "user_favorites" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_favorites_unique" ON "user_favorites" USING btree ("user_id","type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user" ON "user_recents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_recents_type" ON "user_recents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user_type" ON "user_recents" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_last_accessed" ON "user_recents" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_recents_unique" ON "user_recents" USING btree ("user_id","type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_users_battletag" ON "users" USING btree ("battletag");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_users_last_seen" ON "users" USING btree ("last_seen_at");