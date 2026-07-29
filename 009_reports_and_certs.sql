-- ─── Migration 009: Reports, Certificates & Achievements ────────────────────

-- Achievement type catalog
CREATE TABLE IF NOT EXISTS achievement_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    name_ar     VARCHAR(100),
    description TEXT,
    icon        VARCHAR(10),
    color       VARCHAR(20),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Certificates issued to students
CREATE TABLE IF NOT EXISTS certificates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_by        UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    session_id       UUID REFERENCES sessions(id) ON DELETE SET NULL,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('full_quran','half_quran','juz','custom')),
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    juz_from         SMALLINT CHECK (juz_from BETWEEN 1 AND 30),
    juz_to           SMALLINT CHECK (juz_to BETWEEN 1 AND 30),
    accuracy_grade   accuracy_grade,
    certificate_url  TEXT,
    issued_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Student medals / achievements
CREATE TABLE IF NOT EXISTS student_achievements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type_id UUID NOT NULL REFERENCES achievement_types(id) ON DELETE RESTRICT,
    awarded_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    notes               TEXT,
    awarded_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student    ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_by  ON certificates(issued_by);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at  ON certificates(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_student    ON student_achievements(student_id);

-- Auto-update trigger for certificates
CREATE TRIGGER trg_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed achievement types (idempotent)
INSERT INTO achievement_types (code, name, name_ar, description, icon, color) VALUES
('full_quran',         'Full Quran Completion', 'إتمام القرآن الكريم',  'Memorized all 30 Juz',                  '🏆', 'gold'),
('half_quran',         'Half Quran',            'حفظ نصف القرآن',       'Memorized 15 Juz',                      '⭐', 'gold'),
('juz_amma',           'Juz'' Amma',            'جزء عم',               'Memorized Juz'' 30',                    '🌟', 'forest'),
('perfect_attendance', 'Perfect Attendance',    'حضور مثالي',           '100% attendance for a month',            '✅', 'forest'),
('accuracy_excellence','Accuracy Excellence',   'إتقان التجويد',        'Consistently excellent accuracy grade',  '💎', 'gold'),
('consistent_learner', 'Consistent Learner',    'طالب مواظب',           '30+ consecutive session attendance',     '🔥', 'amber')
ON CONFLICT (code) DO NOTHING;
