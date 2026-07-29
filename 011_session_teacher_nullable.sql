-- ============================================================
-- Migration 011: Allow sessions to be created without a teacher
-- ============================================================
-- The application has always supported creating a session without a
-- teacher assigned (status defaults to 'draft' until a teacher requests
-- or is assigned), but the column was mistakenly declared NOT NULL.

ALTER TABLE sessions ALTER COLUMN teacher_id DROP NOT NULL;
