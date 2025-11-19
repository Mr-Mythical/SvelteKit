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
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	"session_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spec_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_code" text NOT NULL,
	"fight_id" integer NOT NULL,
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"spec_icon" text NOT NULL,
	"player_name" text,
	"damage_done" bigint DEFAULT 0,
	"healing_done" bigint DEFAULT 0,
	"dps" integer DEFAULT 0,
	"hps" integer DEFAULT 0,
	"fight_duration" integer,
	"fight_start_time" integer,
	"fight_end_time" integer,
	"difficulty" integer,
	"is_kill" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spec_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"spec_icon" text NOT NULL,
	"difficulty" integer,
	"kills_only" boolean DEFAULT false,
	"death_filter" text DEFAULT 'all',
	"avg_damage_done" bigint,
	"avg_healing_done" bigint,
	"avg_dps" integer,
	"avg_hps" integer,
	"max_damage_done" bigint,
	"max_healing_done" bigint,
	"max_dps" integer,
	"max_hps" integer,
	"min_damage_done" bigint,
	"min_healing_done" bigint,
	"min_dps" integer,
	"min_hps" integer,
	"avg_death_time" integer,
	"death_rate" real DEFAULT 0,
	"sample_count" integer,
	"last_updated" timestamp DEFAULT now()
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
ALTER TABLE "spec_performance" ADD CONSTRAINT "spec_performance_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spec_statistics" ADD CONSTRAINT "spec_statistics_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recents" ADD CONSTRAINT "user_recents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_spec_performance_unique" ON "spec_performance" USING btree ("report_code","fight_id","encounter_id","region","player_name");--> statement-breakpoint
CREATE INDEX "idx_spec_performance_encounter" ON "spec_performance" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_spec_performance_spec" ON "spec_performance" USING btree ("spec_icon");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_spec_statistics_unique" ON "spec_statistics" USING btree ("encounter_id","region","spec_icon","difficulty","kills_only","death_filter");--> statement-breakpoint
CREATE INDEX "idx_spec_statistics_encounter" ON "spec_statistics" USING btree ("encounter_id","region","spec_icon");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user" ON "user_recents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_recents_type" ON "user_recents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user_type" ON "user_recents" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_last_accessed" ON "user_recents" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_recents_unique" ON "user_recents" USING btree ("user_id","type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_users_battletag" ON "users" USING btree ("battletag");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_users_last_seen" ON "users" USING btree ("last_seen_at");