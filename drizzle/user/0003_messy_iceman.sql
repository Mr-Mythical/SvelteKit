CREATE TABLE "user_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"region" varchar(4) NOT NULL,
	"realm_slug" text NOT NULL,
	"realm_name" text NOT NULL,
	"character_name" text NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"race_name" text,
	"faction" varchar(16),
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_characters_user" ON "user_characters" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_characters_unique" ON "user_characters" USING btree ("userId","region","realm_slug","character_name");