-- 010_chatbot_rag.sql
-- Quran Guidance Assistant — RAG vector store + conversation history
-- No external extensions required. Embeddings stored as JSONB;
-- cosine similarity is computed in JavaScript at query time.

-- ─── Verse embeddings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verse_embeddings (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_id       UUID      NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  surah_number   SMALLINT  NOT NULL,
  ayah_number    SMALLINT  NOT NULL,
  arabic_text    TEXT      NOT NULL,
  translation_en TEXT      NOT NULL,
  translation_ms TEXT,
  themes         TEXT[]    NOT NULL DEFAULT '{}',  -- GPT-4o-mini generated spiritual themes
  enriched_text  TEXT      NOT NULL,               -- themes + all translations concatenated for embedding
  embedding      JSONB,                            -- float32[] stored as JSON array; no pgvector needed
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Theme filtering: WHERE themes @> ARRAY['hope']
CREATE INDEX IF NOT EXISTS idx_ve_themes
  ON verse_embeddings USING gin(themes);

CREATE INDEX IF NOT EXISTS idx_ve_verse_id
  ON verse_embeddings(verse_id);

-- ─── Conversation history ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_query         TEXT    NOT NULL,
  assistant_response TEXT,
  emotion_detected   VARCHAR(50),
  topic_detected     VARCHAR(100),
  is_out_of_scope    BOOLEAN DEFAULT FALSE,
  verses_used        JSONB   DEFAULT '[]',  -- [{surah_number, ayah_number, arabic_text, translation_en, themes[], score}]
  top_score          NUMERIC(5,4),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_user
  ON chatbot_conversations(user_id, created_at DESC);
