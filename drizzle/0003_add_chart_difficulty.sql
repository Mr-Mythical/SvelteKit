ALTER TABLE "damage_averages" ADD COLUMN IF NOT EXISTS "difficulty" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "death_hotspots" ADD COLUMN IF NOT EXISTS "difficulty" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "damage_averages" DROP CONSTRAINT IF EXISTS "damage_averages_encounter_id_time_seconds_key";--> statement-breakpoint
ALTER TABLE "death_hotspots" DROP CONSTRAINT IF EXISTS "death_hotspots_encounter_id_time_seconds_key";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "damage_averages_encounter_diff_time_uidx" ON "damage_averages" USING btree ("encounter_id","difficulty","time_seconds");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "death_hotspots_encounter_diff_time_uidx" ON "death_hotspots" USING btree ("encounter_id","difficulty","time_seconds");
