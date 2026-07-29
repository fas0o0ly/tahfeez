-- ============================================================
-- Migration 001: Users & Auth (revised)
-- users holds shared columns only.
-- Role-specific data lives in student_profiles, teacher_profiles, admin_profiles.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role   AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE gender AS ENUM ('male', 'female');

-- ------------------------------------------------------------
-- Core identity — shared across all roles
-- ------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    avatar_url      TEXT,
    status          user_status NOT NULL DEFAULT 'pending',
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    gender          gender,
    nationality     VARCHAR(100),
    preferred_language VARCHAR(50) DEFAULT 'arabic'
);

-- ------------------------------------------------------------
-- Student profile — extends users where role = 'student'
-- ------------------------------------------------------------
CREATE TABLE student_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age                 SMALLINT,
    guardian_name       VARCHAR(150),
    guardian_phone      VARCHAR(30),
    -- juz memorization progress (0–30), supports partial e.g. 14.5
    total_juz_memorized NUMERIC(4,1) NOT NULL DEFAULT 0
                            CHECK (total_juz_memorized BETWEEN 0 AND 30),
    current_level       VARCHAR(50),     -- e.g. 'beginner', 'intermediate', 'advanced'
    enrollment_date     DATE,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Teacher profile — extends users where role = 'teacher'
-- ------------------------------------------------------------
CREATE TABLE teacher_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio                 TEXT,
    qualifications      TEXT,
    years_experience    SMALLINT,
    specializations     TEXT[],         -- e.g. ARRAY['tajweed', 'hifz', 'qiraat']
    ijazah_chain        TEXT,
    ijazah_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    ijazah_verified_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    ijazah_verified_at  TIMESTAMP WITH TIME ZONE,
    available_days      TEXT[],         -- e.g. ARRAY['monday', 'wednesday', 'friday']
    timezone            VARCHAR(60) DEFAULT 'Asia/Kuala_Lumpur',
    max_students        SMALLINT DEFAULT 20,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Admin profile — extends users where role = 'admin'
-- ------------------------------------------------------------
CREATE TABLE admin_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department      VARCHAR(100),
    permissions     TEXT[],         -- e.g. ARRAY['manage_users', 'view_reports']
    is_super_admin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Auth tables
-- ------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE password_resets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_status       ON users(status);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash    ON refresh_tokens(token_hash);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_password_resets_user     ON password_resets(user_id);

-- ------------------------------------------------------------
-- Trigger function (reused by all tables across every migration)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_teacher_profiles_updated_at
    BEFORE UPDATE ON teacher_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
