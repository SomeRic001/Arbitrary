CREATE TABLE "tilt_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tilt_registrations_email_unique" UNIQUE("email"),
	CONSTRAINT "tilt_registrations_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "tilt_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"role" varchar(50) DEFAULT 'outlet' NOT NULL,
	CONSTRAINT "tilt_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lottery_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outlet_id" text NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_hash" text NOT NULL,
	"address" text NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lottery_entries_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "lottery_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"outlet_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "tilt_registrations" ADD CONSTRAINT "tilt_registrations_user_id_tilt_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tilt_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_entries" ADD CONSTRAINT "lottery_entries_campaign_id_lottery_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."lottery_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_entries" ADD CONSTRAINT "lottery_entries_session_id_lottery_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."lottery_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_sessions" ADD CONSTRAINT "lottery_sessions_token_id_qr_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."qr_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_sessions" ADD CONSTRAINT "lottery_sessions_campaign_id_lottery_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."lottery_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_campaign_id_lottery_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."lottery_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tilt_registrations_email_idx" ON "tilt_registrations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "tilt_registrations_phone_idx" ON "tilt_registrations" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "lottery_entries_campaign_email_idx" ON "lottery_entries" USING btree ("campaign_id","email");--> statement-breakpoint
CREATE INDEX "lottery_entries_campaign_phone_hash_idx" ON "lottery_entries" USING btree ("campaign_id","phone_hash");--> statement-breakpoint
CREATE INDEX "qr_tokens_token_idx" ON "qr_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "qr_tokens_session_id_idx" ON "qr_tokens" USING btree ("session_id");