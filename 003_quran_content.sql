-- ============================================================
-- Migration 003: Quran Content (Surahs & Verses)
-- These are reference/seed tables — populated once, rarely changed.
-- ============================================================

CREATE TYPE revelation_type AS ENUM ('meccan', 'medinan');

CREATE TABLE surahs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surah_number            SMALLINT NOT NULL UNIQUE CHECK (surah_number BETWEEN 1 AND 114),
    name_arabic             VARCHAR(100) NOT NULL,
    name_english            VARCHAR(100) NOT NULL,
    name_transliteration    VARCHAR(100) NOT NULL,
    total_verses            SMALLINT NOT NULL,
    revelation_type         revelation_type NOT NULL,
    -- juz that this surah primarily starts in (helpful for navigation)
    juz_number              SMALLINT CHECK (juz_number BETWEEN 1 AND 30),
    -- page range in the standard Mushaf (Madina print)
    page_start              SMALLINT,
    page_end                SMALLINT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE verses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surah_id        UUID NOT NULL REFERENCES surahs(id) ON DELETE RESTRICT,
    verse_number    SMALLINT NOT NULL,
    arabic_text     TEXT NOT NULL,
    -- translations (add more columns or a separate table if multilingual is needed)
    translation_en  TEXT,
    translation_ms  TEXT,  -- Malay — relevant for Malaysian users
    transliteration TEXT,
    -- audio
    audio_url_mishary   TEXT,  -- Mishary Rashid recitation
    audio_url_sudais    TEXT,  -- Abdul Rahman Al-Sudais
    -- mushaf positioning
    page_number     SMALLINT,
    juz_number      SMALLINT CHECK (juz_number BETWEEN 1 AND 30),
    hizb_quarter    SMALLINT,
    -- tajweed
    tajweed_text    TEXT,  -- HTML/tagged version for color-coded tajweed display
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_verse UNIQUE (surah_id, verse_number)
);

-- Indexes
CREATE INDEX idx_verses_surah_id    ON verses(surah_id);
CREATE INDEX idx_verses_page        ON verses(page_number);
CREATE INDEX idx_verses_juz         ON verses(juz_number);
CREATE INDEX idx_surahs_number      ON surahs(surah_number);

CREATE TRIGGER trg_surahs_updated_at
    BEFORE UPDATE ON surahs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_verses_updated_at
    BEFORE UPDATE ON verses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
