ALTER TABLE "sessions" DROP CONSTRAINT "sessions_sessionToken_unique";--> statement-breakpoint
DROP INDEX "idx_sessions_token";--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("sessionToken");--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "id";