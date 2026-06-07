-- Migration 0010: Simplify task types by converting granular social types to social_media
-- We no longer use VIDEO_LIKE, VIDEO_SUBSCRIBE as distinct task_type values.
-- Pattern-based detection (isYtLike, isYtSubscribe, isYtComment) replaces them.
-- VIDEO_WATCH remains separate (server-authoritative, relies on watch_sessions).

UPDATE "tasks" SET "task_type" = 'social_media' WHERE "task_type" IN ('VIDEO_LIKE', 'VIDEO_SUBSCRIBE');
