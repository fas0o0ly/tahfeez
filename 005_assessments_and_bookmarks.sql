-- ============================================================
-- Migration 005: Recitation Assessments & Bookmarks
-- ============================================================

CREATE TYPE assessment_status AS ENUM (
    'pending',      -- audio uploaded, waiting for AI processing
    'processing',   -- AI is analysing
    'completed',    -- results ready
    'failed'        -- AI processing failed
);



CREATE TABLE recitation_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    surah_id        UUID NOT NULL REFERENCES surahs(id) ON DELETE RESTRICT,
    from_verse      SMALLINT NOT NULL,
    to_verse        SMALLINT NOT NULL,
    audio_url       TEXT NOT NULL,
    audio_duration_seconds INT,
    -- AI results
    overall_score   SMALLINT CHECK (overall_score BETWEEN 0 AND 100),
    -- tajweed_feedback: JSON array of rule violations with timestamps
    -- e.g. [{ "rule": "idgham", "verse": 3, "timestamp_s": 12.4, "severity": "minor" }]
    tajweed_feedback    JSONB,
    pronunciation_notes TEXT,
    fluency_grade       accuracy_grade,
    tajweed_grade       accuracy_grade,
    makharij_grade      accuracy_grade,
    status              assessment_status NOT NULL DEFAULT 'pending',
    -- optional teacher override/annotation after AI assessment
    teacher_review      TEXT,
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (from_verse <= to_verse)
);

CREATE TABLE bookmarks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    surah_id    UUID NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
    verse_id    UUID REFERENCES verses(id) ON DELETE CASCADE,
    label       VARCHAR(100),
    color       VARCHAR(7),  -- hex color for visual grouping (e.g. '#2D6A4F')
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- A user can bookmark the same verse multiple times with different labels
    CONSTRAINT uq_bookmark UNIQUE (user_id, surah_id, verse_id, label)
);

-- Indexes
CREATE INDEX idx_assessments_student    ON recitation_assessments(student_id);
CREATE INDEX idx_assessments_session    ON recitation_assessments(session_id);
CREATE INDEX idx_assessments_surah      ON recitation_assessments(surah_id);
CREATE INDEX idx_assessments_status     ON recitation_assessments(status);
CREATE INDEX idx_bookmarks_user         ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_surah        ON bookmarks(surah_id);
CREATE INDEX idx_bookmarks_verse        ON bookmarks(verse_id);

CREATE TRIGGER trg_assessments_updated_at
    BEFORE UPDATE ON recitation_assessments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
