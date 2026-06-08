ALTER TABLE "users" ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verification_token" text;
ALTER TABLE "users" ADD COLUMN "verification_token_expires_at" timestamp;
