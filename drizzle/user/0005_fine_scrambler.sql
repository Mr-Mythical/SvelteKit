ALTER TABLE "user_recents" RENAME COLUMN "user_id" TO "userId";--> statement-breakpoint
ALTER TABLE "user_recents" DROP CONSTRAINT "user_recents_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_user_recents_user";--> statement-breakpoint
DROP INDEX "idx_user_recents_user_type";--> statement-breakpoint
DROP INDEX "idx_user_recents_unique";--> statement-breakpoint
ALTER TABLE "user_recents" ADD CONSTRAINT "user_recents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_recents_user" ON "user_recents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user_type" ON "user_recents" USING btree ("userId","type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_recents_unique" ON "user_recents" USING btree ("userId","type","entity_id");