ALTER TABLE "accounts" RENAME COLUMN "user_id" TO "providerAccountId";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "session_token" TO "sessionToken";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_accounts_user";--> statement-breakpoint
DROP INDEX "idx_accounts_provider";--> statement-breakpoint
DROP INDEX "idx_sessions_user";--> statement-breakpoint
DROP INDEX "idx_sessions_token";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("sessionToken");--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "provider_account_id";