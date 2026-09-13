-- Raid analytics tables merged from RaidData into the unified user database.
-- Matches WebsiteDataCollection/database_schema.sql (live cloud aggregates).

CREATE TABLE IF NOT EXISTS "encounters" (
	"encounter_id" integer PRIMARY KEY NOT NULL,
	"encounter_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "healer_compositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_code" text NOT NULL,
	"fight_id" integer NOT NULL,
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"spec_icons" jsonb NOT NULL,
	"fight_duration" integer,
	"last_updated" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "healer_compositions_report_code_fight_id_encounter_id_regio_key" UNIQUE("report_code","fight_id","encounter_id","region")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "damage_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounter_id" integer NOT NULL,
	"difficulty" integer DEFAULT 5 NOT NULL,
	"time_seconds" integer NOT NULL,
	"avg_damage" integer,
	"std_dev" integer,
	"sample_count" integer,
	"confidence_interval" integer,
	"last_updated" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "damage_averages_encounter_id_difficulty_time_seconds_key" UNIQUE("encounter_id","difficulty","time_seconds")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "death_hotspots" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounter_id" integer NOT NULL,
	"difficulty" integer DEFAULT 5 NOT NULL,
	"time_seconds" integer NOT NULL,
	"death_count" integer NOT NULL,
	"sample_count" integer NOT NULL,
	"last_updated" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "death_hotspots_encounter_id_difficulty_time_seconds_key" UNIQUE("encounter_id","difficulty","time_seconds")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spec_statistics" (
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
	"last_updated" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "spec_statistics_encounter_id_region_spec_icon_difficulty_ki_key" UNIQUE("encounter_id","region","spec_icon","difficulty","kills_only","death_filter")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "death_rate" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounter_id" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"death_count" integer NOT NULL,
	"sample_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spec_performance" (
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
	"death_count" integer DEFAULT 0,
	"death_time" integer,
	"time_dead_ms" integer DEFAULT 0,
	"time_alive_percentage" real DEFAULT 100,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "healer_compositions" ADD CONSTRAINT "healer_compositions_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_averages" ADD CONSTRAINT "damage_averages_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_hotspots" ADD CONSTRAINT "death_hotspots_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spec_statistics" ADD CONSTRAINT "spec_statistics_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "death_rate" ADD CONSTRAINT "death_rate_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spec_performance" ADD CONSTRAINT "spec_performance_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_healer_comp_encounter" ON "healer_compositions" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_damage_averages_encounter" ON "damage_averages" USING btree ("encounter_id","difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_death_hotspots_encounter" ON "death_hotspots" USING btree ("encounter_id","difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_statistics_encounter" ON "spec_statistics" USING btree ("encounter_id","region","spec_icon");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_death_rate_encounter" ON "death_rate" USING btree ("encounter_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_spec_performance_unique" ON "spec_performance" USING btree ("report_code","fight_id","encounter_id","region","player_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_performance_encounter" ON "spec_performance" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_spec_performance_spec" ON "spec_performance" USING btree ("spec_icon");
