-- Migration 0012: Retention cleanup function for admin_activity_logs
-- Run this via cron (e.g., GitHub Actions) every 24 hours

CREATE OR REPLACE FUNCTION cleanup_old_admin_logs()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM "admin_activity_logs"
  WHERE "created_at" < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
