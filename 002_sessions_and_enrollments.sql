-- ============================================================
-- Migration 002: Sessions (Halaqah) & Enrollments
-- ============================================================

CREATE TYPE session_status AS ENUM (
    'draft', 'scheduled', 'live', 'completed', 'cancelled'
);

CREATE TYPE session_type AS ENUM (
    'one_on_one', 'group', 'open'
);

CREATE TYPE enrollment_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled', 'completed'
);

CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    session_type        session_type NOT NULL DEFAULT 'group',
    status              session_status NOT NULL DEFAULT 'draft',
    scheduled_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    session_days        TEXT[] NOT NULL,
    duration_minutes    SMALLINT NOT NULL DEFAULT 60,
    max_students        SMALLINT NOT NULL DEFAULT 10,
    session_gender      gender NOT NULL,
    age_range_min   SMALLINT CHECK (age_range_min >= 4),
    age_range_max   SMALLINT CHECK (age_range_max <= 100),
    -- agora
    agora_channel       VARCHAR(100) UNIQUE,
    -- lifecycle timestamps
    started_at          TIMESTAMP WITH TIME ZONE,
    ended_at            TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_language    VARCHAR(50) NOT NULL DEFAULT 'arabic',
    CONSTRAINT chk_age_range CHECK (age_range_min < age_range_max)

);

CREATE TABLE session_enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      enrollment_status NOT NULL DEFAULT 'pending',
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_enrollment UNIQUE (session_id, student_id)
);

CREATE TABLE agora_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_teacher_id   ON sessions(teacher_id);
CREATE INDEX idx_sessions_status       ON sessions(status);
CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX idx_enrollments_session   ON session_enrollments(session_id);
CREATE INDEX idx_enrollments_student   ON session_enrollments(student_id);
CREATE INDEX idx_enrollments_status    ON session_enrollments(status);
CREATE INDEX idx_agora_tokens_session  ON agora_tokens(session_id);
CREATE INDEX idx_agora_tokens_user     ON agora_tokens(user_id);

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_enrollments_updated_at
    BEFORE UPDATE ON session_enrollments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agora_tokens_updated_at
    BEFORE UPDATE ON agora_tokens
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
