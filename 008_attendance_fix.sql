-- ============================================================
-- Migration 008: Attendance fix for recurring sessions
-- ============================================================
-- Problems fixed:
--   1. attendance had UNIQUE(session_id, student_id) — wrong for
--      recurring sessions that meet weekly for years. Changed to
--      UNIQUE(session_id, student_id, occurrence_date) so each
--      meeting gets its own record.
--   2. progress_records had a broken index on non-existent surah_id.
--   3. total_surahs_memorized had no DEFAULT, breaking INSERT with defaults.

-- Fix 1: add occurrence_date to attendance and fix unique constraint
ALTER TABLE attendance ADD COLUMN occurrence_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE attendance DROP CONSTRAINT uq_attendance;
ALTER TABLE attendance ADD CONSTRAINT uq_attendance UNIQUE (session_id, student_id, occurrence_date);
CREATE INDEX idx_attendance_date ON attendance(occurrence_date);

-- Fix 2: drop broken index from 004
DROP INDEX IF EXISTS idx_progress_surah;

-- Fix 3: give total_surahs_memorized a default so UPSERT works
ALTER TABLE progress_records ALTER COLUMN total_surahs_memorized SET DEFAULT 0;
