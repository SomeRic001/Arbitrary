-- Migration 0011: Evolve admin_activity_logs for real-time audit system v3.0

-- Add new columns
ALTER TABLE "admin_activity_logs" ADD COLUMN IF NOT EXISTS "log_level" varchar(20) NOT NULL DEFAULT 'INFO';
ALTER TABLE "admin_activity_logs" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "admin_activity_logs" ADD COLUMN IF NOT EXISTS "ip_address" varchar(45);

-- Change action from text to varchar(100)
ALTER TABLE "admin_activity_logs" ALTER COLUMN "action" TYPE varchar(100);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_admin_logs_admin_id" ON "admin_activity_logs" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_admin_logs_created_at" ON "admin_activity_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_admin_logs_entity" ON "admin_activity_logs" ("entity_type", "entity_id");

-- Trigger function for NOTIFY on insert
CREATE OR REPLACE FUNCTION notify_admin_log_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('admin_logs', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_admin_log_notify ON "admin_activity_logs";
CREATE TRIGGER trg_admin_log_notify
  AFTER INSERT ON "admin_activity_logs"
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_log_insert();
