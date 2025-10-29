CREATE TABLE "application_locks" (
	"lock_name" text PRIMARY KEY NOT NULL,
	"locked_by" text NOT NULL,
	"locked_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"process_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "collection_progress" (
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"collection_type" text NOT NULL,
	"last_page" integer DEFAULT 0,
	"reports_collected" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "collection_progress_encounter_id_region_collection_type_pk" PRIMARY KEY("encounter_id","region","collection_type")
);
--> statement-breakpoint
CREATE TABLE "damage_averages" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounter_id" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"avg_damage" integer,
	"std_dev" integer,
	"count" integer,
	"confidence_interval" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "damage_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"timestamp_ms" bigint NOT NULL,
	"damage_value" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"encounter_id" integer PRIMARY KEY NOT NULL,
	"encounter_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "healer_compositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"spec_icons" json NOT NULL,
	"fight_duration" integer,
	CONSTRAINT "healer_compositions_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "progress_validation" (
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"collection_type" text NOT NULL,
	"expected_reports" integer DEFAULT 0,
	"actual_reports" integer DEFAULT 0,
	"last_validated" timestamp DEFAULT now(),
	"inconsistencies_detected" integer DEFAULT 0,
	CONSTRAINT "progress_validation_encounter_id_region_collection_type_pk" PRIMARY KEY("encounter_id","region","collection_type")
);
--> statement-breakpoint
CREATE TABLE "unified_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_code" text NOT NULL,
	"fight_id" integer NOT NULL,
	"encounter_id" integer NOT NULL,
	"region" text NOT NULL,
	"guild_name" text,
	"ranking_start_time" bigint,
	"ranking_duration" integer,
	"fight_start_time" integer,
	"fight_end_time" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "collection_progress" ADD CONSTRAINT "collection_progress_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_averages" ADD CONSTRAINT "damage_averages_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damage_data" ADD CONSTRAINT "damage_data_report_id_unified_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."unified_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "healer_compositions" ADD CONSTRAINT "healer_compositions_report_id_unified_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."unified_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_validation" ADD CONSTRAINT "progress_validation_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unified_reports" ADD CONSTRAINT "unified_reports_encounter_id_encounters_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("encounter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_damage_data_report" ON "damage_data" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "damage_data_report_id_timestamp_ms_index" ON "damage_data" USING btree ("report_id","timestamp_ms");--> statement-breakpoint
CREATE INDEX "idx_healer_compositions_report" ON "healer_compositions" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unified_reports_unique" ON "unified_reports" USING btree ("report_code","fight_id","encounter_id","region");--> statement-breakpoint
CREATE INDEX "idx_unified_reports_encounter" ON "unified_reports" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "idx_unified_reports_region" ON "unified_reports" USING btree ("region");
--> statement-breakpoint
INSERT INTO "encounters" ("encounter_id", "encounter_name") VALUES
    (3122, 'Encounter 3122'),
    (3129, 'Encounter 3129'),
    (3130, 'Encounter 3130'),
    (3131, 'Encounter 3131'),
    (3132, 'Encounter 3132'),
    (3133, 'Encounter 3133'),
    (3134, 'Encounter 3134'),
    (3135, 'Encounter 3135')
ON CONFLICT ("encounter_id") DO NOTHING;