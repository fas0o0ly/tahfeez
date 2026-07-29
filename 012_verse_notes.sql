-- ============================================================
-- Migration 012: Verse Notes
-- One note per user per verse, upserted on save.
-- ============================================================

CREATE TABLE verse_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  verse_id   UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_verse_note UNIQUE (user_id, verse_id)
);

CREATE INDEX idx_verse_notes_user  ON verse_notes(user_id);
CREATE INDEX idx_verse_notes_verse ON verse_notes(verse_id);

CREATE TRIGGER trg_verse_notes_updated_at
  BEFORE UPDATE ON verse_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
