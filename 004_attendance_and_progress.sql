-- ============================================================
-- Migration 004: Attendance & Progress Tracking
-- ============================================================

CREATE TYPE progress_status AS ENUM (
    'not_started',
    'in_progress',
    'needs_revision',
    'completed',
    'certified'
);

CREATE TYPE accuracy_grade AS ENUM (
    'excellent',
    'very_good',
    'good',
    'acceptable',
    'weak'
);

CREATE TABLE attendance (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    present     BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at   TIMESTAMP WITH TIME ZONE,
    left_at     TIMESTAMP WITH TIME ZONE,
    -- duration in seconds, computed on leave or calculated from joined/left
    duration_seconds INT,
    notes       TEXT,
    marked_by   UUID REFERENCES users(id),  -- teacher who marked attendance
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance UNIQUE (session_id, student_id)
);

-- One record per student per surah — teacher updates this over time
CREATE TABLE progress_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    status              progress_status NOT NULL DEFAULT 'not_started',
    total_juz_memorized    SMALLINT NOT NULL DEFAULT 0,
    total_surahs_memorized        SMALLINT NOT NULL,
    accuracy_grade      accuracy_grade,
    teacher_notes       TEXT,
    last_reviewed_at    TIMESTAMP WITH TIME ZONE,
    -- milestone tracking
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    certified_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_progress UNIQUE (student_id)
);



-- Teacher notes/observations per student (separate from progress notes — more like a log)
CREATE TABLE teacher_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    is_private  BOOLEAN NOT NULL DEFAULT FALSE,  -- private = only teacher can see
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attendance_session   ON attendance(session_id);
CREATE INDEX idx_attendance_student   ON attendance(student_id);
CREATE INDEX idx_progress_student     ON progress_records(student_id);
CREATE INDEX idx_progress_surah       ON progress_records(surah_id);
CREATE INDEX idx_progress_teacher     ON progress_records(teacher_id);
CREATE INDEX idx_progress_status      ON progress_records(status);
CREATE INDEX idx_teacher_notes_teacher  ON teacher_notes(teacher_id);
CREATE INDEX idx_teacher_notes_student  ON teacher_notes(student_id);

CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_progress_updated_at
    BEFORE UPDATE ON progress_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();



CREATE TRIGGER trg_teacher_notes_updated_at
    BEFORE UPDATE ON teacher_notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
