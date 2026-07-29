-- ============================================================
-- Migration 006: Messaging & Notifications
-- ============================================================

CREATE TYPE notification_type AS ENUM (
    'session_reminder',
    'session_started',
    'session_cancelled',
    'enrollment_approved',
    'enrollment_rejected',
    'new_message',
    'assessment_ready',
    'progress_update',
    'account_status_changed',
    'system'
);

CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_message_id   UUID REFERENCES messages(id) ON DELETE SET NULL,
    subject             VARCHAR(255),
    content             TEXT NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    -- soft delete per side (sender/recipient can delete their copy independently)
    deleted_by_sender       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by_recipient    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (sender_id <> recipient_id)
);

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    body        TEXT NOT NULL,
    type        notification_type NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMP WITH TIME ZONE,
    -- flexible JSON for linking to context (e.g. { "session_id": "...", "url": "/sessions/..." })
    meta        JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_sender       ON messages(sender_id);
CREATE INDEX idx_messages_recipient    ON messages(recipient_id);
CREATE INDEX idx_messages_parent       ON messages(parent_message_id);
CREATE INDEX idx_messages_is_read      ON messages(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_type    ON notifications(type);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
