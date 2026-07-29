// src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');
const logger = require('../utils/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

// ─── Token helpers ─────────────────────────────────────────────────────────

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ─── Register ──────────────────────────────────────────────────────────────

const register = async ({ full_name, email, password, role, gender, phone, nationality, date_of_birth, preferred_language, cv_url }) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists', 409);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, gender, nationality, date_of_birth, preferred_language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING id, email, role, full_name, status, created_at`,
      [email, password_hash, role, full_name, phone || null, gender, nationality || null, date_of_birth || null, preferred_language || 'arabic']
    );

    const user = userResult.rows[0];

    if (role === 'student') {
      await client.query(
        'INSERT INTO student_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    } else if (role === 'teacher') {
      await client.query(
        `INSERT INTO teacher_profiles (user_id, timezone, cv_url) VALUES ($1, 'Asia/Kuala_Lumpur', $2)`,
        [user.id, cv_url || null]
      );
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO email_verifications (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    await client.query('COMMIT');

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    sendVerificationEmail(email, full_name, verificationUrl).catch((err) => {
      logger.error('Verification email failed (non-blocking):', err);
    });

    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────

const verifyEmail = async (rawToken) => {
  const tokenHash = hashToken(rawToken);

  const result = await query(
    `SELECT ev.id, ev.user_id, ev.expires_at, ev.used_at, u.role
     FROM email_verifications ev
     JOIN users u ON u.id = ev.user_id
     WHERE ev.token_hash = $1`,
    [tokenHash]
  );

  const record = result.rows[0];

  if (!record) throw new AppError('Invalid verification token', 400);
  if (record.used_at) throw new AppError('This verification link has already been used', 400);
  if (new Date(record.expires_at) < new Date()) throw new AppError('Verification link expired', 400);

  // Teachers stay 'pending' after email verification — they still need admin approval.
  // Students/admins are activated immediately since there's no approval step for them.
  const newStatus = record.role === 'teacher' ? 'pending' : 'active';

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET email_verified = TRUE, status = $1, updated_at = NOW() WHERE id = $2 AND status = $3',
      [newStatus, record.user_id, 'pending']
    );

    await client.query(
      'UPDATE email_verifications SET used_at = NOW() WHERE id = $1',
      [record.id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { role: record.role, requiresApproval: record.role === 'teacher' };
};

// ─── Login ─────────────────────────────────────────────────────────────────

const login = async (email, password, ipAddress, userAgent) => {
  const result = await query(
    `SELECT id, email, password_hash, role, full_name, status, email_verified, avatar_url
     FROM users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];

  // Constant-time comparison even for missing users — prevents timing attacks
  const dummyHash = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000';
  const passwordMatch = await bcrypt.compare(password, user?.password_hash || dummyHash);

  if (!user || !passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.email_verified) {
    throw new AppError('Please verify your email address before logging in', 403);
  }

  if (user.status === 'suspended') {
    throw new AppError('Your account has been suspended. Contact support.', 403);
  }

  if (user.status === 'banned') {
    throw new AppError('Your account has been banned', 403);
  }

  if (user.status === 'pending') {
    throw new AppError('Your account is awaiting admin approval', 403);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, refreshTokenHash, expiresAt, ipAddress, userAgent]
  );

  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const { password_hash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

// ─── Refresh Token ─────────────────────────────────────────────────────────

const refreshAccessToken = async (rawRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = hashToken(rawRefreshToken);

  const result = await query(
    `SELECT rt.id, rt.is_revoked, rt.expires_at, u.id as user_id, u.role, u.status
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [tokenHash]
  );

  const record = result.rows[0];

  if (!record || record.is_revoked) {
    throw new AppError('Refresh token is invalid or revoked', 401);
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  if (record.status !== 'active') {
    throw new AppError(`Account is ${record.status}`, 403);
  }

  const newAccessToken = generateAccessToken(record.user_id, record.role);
  return { accessToken: newAccessToken };
};

// ─── Logout ────────────────────────────────────────────────────────────────

const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;

  const tokenHash = hashToken(rawRefreshToken);
  await query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
};

// ─── Forgot Password ───────────────────────────────────────────────────────

const forgotPassword = async (email) => {
  const result = await query(
    'SELECT id, full_name, status FROM users WHERE email = $1',
    [email]
  );

  // Always respond the same — prevents email enumeration
  const user = result.rows[0];
  if (!user || user.status === 'banned') return;

  // Invalidate any previous unused tokens first
  await query(
    `UPDATE password_resets SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  sendPasswordResetEmail(email, user.full_name, resetUrl).catch((err) => {
    logger.error('Password reset email failed (non-blocking):', err);
  });
};

// ─── Reset Password ────────────────────────────────────────────────────────

const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);

  const result = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
     FROM password_resets pr WHERE pr.token_hash = $1`,
    [tokenHash]
  );

  const record = result.rows[0];

  if (!record) throw new AppError('Invalid reset token', 400);
  if (record.used_at) throw new AppError('Reset link already used', 400);
  if (new Date(record.expires_at) < new Date()) throw new AppError('Reset link expired', 400);

  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, record.user_id]
    );

    await client.query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = $1',
      [record.id]
    );

    // Force re-login on all devices after password reset
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [record.user_id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Change Password ───────────────────────────────────────────────────────

const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    // Revoke all refresh tokens — force re-login on other devices
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Get Profile ───────────────────────────────────────────────────────────

const getProfile = async (userId, role) => {
  let profileQuery;

  if (role === 'student') {
    profileQuery = `
      SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role,
             u.status, u.gender, u.nationality, u.preferred_language,
             u.email_verified, u.last_login_at, u.created_at,
             sp.age, sp.guardian_name, sp.guardian_phone,
             sp.total_juz_memorized, sp.current_level, sp.enrollment_date, sp.notes
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1
    `;
  } else if (role === 'teacher') {
    profileQuery = `
      SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role,
             u.status, u.gender, u.nationality, u.preferred_language,
             u.email_verified, u.last_login_at, u.created_at,
             tp.bio, tp.qualifications, tp.years_experience, tp.specializations,
             tp.ijazah_chain, tp.ijazah_verified, tp.available_days,
             tp.timezone, tp.max_students
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      WHERE u.id = $1
    `;
  } else {
    profileQuery = `
      SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role,
             u.status, u.gender, u.nationality, u.preferred_language,
             u.email_verified, u.last_login_at, u.created_at,
             ap.department, ap.permissions, ap.is_super_admin
      FROM users u
      LEFT JOIN admin_profiles ap ON ap.user_id = u.id
      WHERE u.id = $1
    `;
  }

  const result = await query(profileQuery, [userId]);
  const profile = result.rows[0];

  if (!profile) throw new AppError('User not found', 404);
  return profile;
};

// ─── resend Verification Email ────────────────────────────────────────────────────────

const resendVerificationEmail = async (email) => {
  const result = await query(
    'SELECT id, full_name, email_verified, status FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) return;

  if (user.email_verified) {
    throw new AppError('This account is already verified. Please sign in.', 400);
  }

  if (user.status === 'banned') return;

  await query(
    `UPDATE email_verifications SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  sendVerificationEmail(email, user.full_name, verificationUrl).catch((err) => {
    logger.error('Resend verification email failed (non-blocking):', err);
  });
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  resendVerificationEmail,
};