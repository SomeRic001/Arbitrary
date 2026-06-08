-- Add missing columns to access_types
ALTER TABLE "access_types" ADD COLUMN IF NOT EXISTS "point_cost" integer NOT NULL DEFAULT 0;

-- Add missing columns to user_tasks (from 0007 migration, may not have been applied)
ALTER TABLE "user_tasks" ADD COLUMN IF NOT EXISTS "submission_fingerprint" varchar(255);
ALTER TABLE "user_tasks" ADD COLUMN IF NOT EXISTS "completion_duration_seconds" integer;

-- Add missing columns to users (from 0007 migration)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fraud_risk_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_flagged" boolean DEFAULT false NOT NULL;

-- Add missing columns to tasks (from 0007 migration)
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "difficulty" varchar(20) DEFAULT 'easy' NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_flash" boolean DEFAULT false NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_share" boolean DEFAULT false NOT NULL;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "share_threshold" integer DEFAULT 3;

-- Add missing columns to user_tickets (from 0007 migration)
ALTER TABLE "user_tickets" ADD COLUMN IF NOT EXISTS "redemption_token" varchar(255) NOT NULL DEFAULT '';
ALTER TABLE "user_tickets" ADD COLUMN IF NOT EXISTS "redeemed_by" integer;

-- Create missing tables from 0007
CREATE TABLE IF NOT EXISTS "share_clicks" (
    "id" serial PRIMARY KEY NOT NULL,
    "share_code" varchar(20) NOT NULL,
    "visitor_ip" varchar(50),
    "fingerprint" varchar(255),
    "user_agent" varchar(500),
    "clicked_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "share_tasks" (
    "id" serial PRIMARY KEY NOT NULL,
    "task_id" integer REFERENCES "tasks"("id") ON DELETE CASCADE,
    "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
    "share_code" varchar(20) NOT NULL,
    "target_url" text DEFAULT '' NOT NULL,
    "share_url" text NOT NULL,
    "owner_fingerprint" varchar(255),
    "click_count" integer DEFAULT 0 NOT NULL,
    "unique_clicks" integer DEFAULT 0 NOT NULL,
    "points_awarded" boolean DEFAULT false NOT NULL,
    "click_threshold" integer DEFAULT 3 NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "completed_at" timestamp
);

-- Create missing table from 0008
CREATE TABLE IF NOT EXISTS "youtube_sessions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_task_id" integer NOT NULL REFERENCES "user_tasks"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "session_token" varchar(255) NOT NULL,
    "last_heartbeat_at" timestamp DEFAULT now() NOT NULL,
    "expected_heartbeats" integer NOT NULL,
    "heartbeat_count" integer DEFAULT 0 NOT NULL,
    "challenge_second" integer NOT NULL,
    "challenge_completed" boolean DEFAULT false NOT NULL,
    "consecutive_failures" integer DEFAULT 0 NOT NULL,
    "status" varchar(50) DEFAULT 'active' NOT NULL,
    "expires_at" timestamp NOT NULL
);

-- Create tables that exist in schema but never had migrations
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" serial PRIMARY KEY NOT NULL,
    "referrer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "referred_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "points_awarded" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "rate_limits" (
    "key" varchar(255) PRIMARY KEY NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "used_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "timeline_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "time" varchar(100) NOT NULL,
    "description" text NOT NULL,
    "order" integer NOT NULL
);

-- Add unique constraint for share_tasks share_code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'share_tasks_share_code_unique'
    ) THEN
        ALTER TABLE "share_tasks" ADD CONSTRAINT "share_tasks_share_code_unique" UNIQUE("share_code");
    END IF;
END $$;

-- Add unique constraint for user_tickets redemption_token if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_tickets_redemption_token_unique'
    ) THEN
        ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_redemption_token_unique" UNIQUE("redemption_token");
    END IF;
END $$;
