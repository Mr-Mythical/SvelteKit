CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"battletag" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"battlenet_access_token" text,
	"battlenet_refresh_token" text,
	"battlenet_expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_recents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_data" jsonb NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recents" ADD CONSTRAINT "user_recents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_user" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_accounts_provider" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("sessionToken");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "idx_profiles_battletag" ON "user_profiles" USING btree ("battletag");--> statement-breakpoint
CREATE INDEX "idx_profiles_active" ON "user_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_profiles_last_seen" ON "user_profiles" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user" ON "user_recents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_recents_type" ON "user_recents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_user_type" ON "user_recents" USING btree ("userId","type");--> statement-breakpoint
CREATE INDEX "idx_user_recents_last_accessed" ON "user_recents" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_recents_unique" ON "user_recents" USING btree ("userId","type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");