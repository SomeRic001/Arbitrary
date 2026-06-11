-- Migration 0013: Create facebook_comment_cache table
-- This table was added to the schema but never had a migration created.
-- The unique constraint on (post_id, page_index) is required for the
-- onConflictDoNothing() mutex in verifyFacebookComment to work.

CREATE TABLE IF NOT EXISTS "facebook_comment_cache" (
    "post_id" varchar(255) NOT NULL,
    "page_index" integer NOT NULL,
    "data" jsonb NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending',
    "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "facebook_comment_cache_pk" ON "facebook_comment_cache" ("post_id", "page_index");
