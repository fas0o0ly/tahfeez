-- ============================================================
-- Migration 007: Audit Log & Reader Sessions
-- ============================================================

-- Lightweight audit trail for admin actions and sensitive operations
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,  -- e.g. 'user.status_changed', 'session.cancelled'
    target_type VARCHAR(50),            -- e.g. 'user', 'session'
    target_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    -- no updated_at — audit logs are immutable
);

-- Tracks where a user left off in the Quran reader (last read position)
CREATE TABLE reading_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    surah_id        UUID NOT NULL REFERENCES surahs(id) ON DELETE RESTRICT,
    verse_id        UUID REFERENCES verses(id) ON DELETE SET NULL,
    page_number     SMALLINT,
    -- store which audio reciter was last used
    last_reciter    VARCHAR(50) DEFAULT 'mishary',
    duration_seconds INT NOT NULL DEFAULT 0,  -- total time spent reading in this session
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- The user's current bookmark / last-read position (single row per user, upserted)
CREATE TABLE reading_position (
    user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    surah_id    UUID NOT NULL REFERENCES surahs(id) ON DELETE RESTRICT,
    verse_id    UUID REFERENCES verses(id) ON DELETE SET NULL,
    page_number SMALLINT,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_actor      ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_target     ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);

CREATE TRIGGER trg_reading_sessions_updated_at
    BEFORE UPDATE ON reading_sessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reading_position_updated_at
    BEFORE UPDATE ON reading_position
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
