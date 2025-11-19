ALTER TABLE "spec_performance" ADD COLUMN "death_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "spec_performance" ADD COLUMN "death_time" integer;--> statement-breakpoint
ALTER TABLE "spec_performance" ADD COLUMN "time_dead_ms" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "spec_performance" ADD COLUMN "time_alive_percentage" real DEFAULT 100;