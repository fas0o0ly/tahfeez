const { RtcTokenBuilder, RtcRole } = require('agora-token');
const agoraConfig = require('../config/agora');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Derives a numeric UID that is:
 *  - Stable within a single live period (same started_at → same UID, so
 *    a reconnect during the same session sees the same participant slot).
 *  - Different across live periods (new started_at → new UID), so
 *    restarting the same session never causes UID_CONFLICT.
 */
function uidForSessionStart(userId, startedAt) {
  const userPart = parseInt(userId.replace(/-/g, '').slice(-8), 16) >>> 0;
  const timePart = startedAt
    ? (Math.floor(new Date(startedAt).getTime() / 1000)) >>> 0
    : 0;
  return (userPart ^ timePart) >>> 0; // unsigned 32-bit XOR
}

/**
 * Generate an RTC token and persist it.
 * Returns { token, uid, channelName, expiresAt }
 */
async function generateToken(sessionId, userId, userRole) {
  // Sanity-check all three params are present before doing anything
  if (!sessionId || !userId || !userRole) {
    const err = new Error(`generateToken called with missing params — sessionId: ${sessionId}, userId: ${userId}, userRole: ${userRole}`);
    err.statusCode = 400;
    throw err;
  }

  // Pull the session so we can validate status and get the channel name
  const sessionResult = await db.query(
    `SELECT id, agora_channel, status, teacher_id, started_at FROM sessions WHERE id = $1`,
    [sessionId]
  );

  if (sessionResult.rowCount === 0) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  const session = sessionResult.rows[0];

  if (session.status !== 'live') {
    const err = new Error('Session is not live. You can only join an active session.');
    err.statusCode = 403;
    throw err;
  }

  // Students must be enrolled and approved before they can get a token
  if (userRole === 'student') {
    const enrollment = await db.query(
      `SELECT status FROM session_enrollments
       WHERE session_id = $1 AND student_id = $2`,
      [sessionId, userId]
    );

    if (enrollment.rowCount === 0 || enrollment.rows[0].status !== 'approved') {
      const err = new Error('You are not enrolled in this session.');
      err.statusCode = 403;
      throw err;
    }
  }

  // Teachers can only join their own sessions
  if (userRole === 'teacher' && session.teacher_id !== userId) {
    const err = new Error('You are not the teacher of this session.');
    err.statusCode = 403;
    throw err;
  }

  const channelName = session.agora_channel;
  if (!channelName) {
    const err = new Error('This session does not have a channel configured.');
    err.statusCode = 400;
    throw err;
  }

  const uid = uidForSessionStart(userId, session.started_at);
  // All roles get PUBLISHER so they can publish their audio stream.
  // Students publish audio only (enforced in the frontend hook).
  // SUBSCRIBER-only tokens would prevent students from transmitting their recitation.
  const role = RtcRole.PUBLISHER;
  const expiresAt = Math.floor(Date.now() / 1000) + agoraConfig.tokenExpirySeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    agoraConfig.appId,
    agoraConfig.appCertificate,
    channelName,
    uid,
    role,
    expiresAt,
    expiresAt
  );

  // Revoke any previous non-expired tokens for this user+session
  await db.query(
    `UPDATE agora_tokens
     SET is_revoked = TRUE, updated_at = NOW()
     WHERE session_id = $1 AND user_id = $2 AND is_revoked = FALSE`,
    [sessionId, userId]
  );

  // Persist the new token
  const expiresAtTimestamp = new Date(expiresAt * 1000).toISOString();
  await db.query(
    `INSERT INTO agora_tokens (session_id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, userId, token, expiresAtTimestamp]
  );

  // Record attendance for today's occurrence when a student joins.
  // ON CONFLICT DO NOTHING so a same-day rejoin is idempotent.
  if (userRole === 'student') {
    await db.query(
      `INSERT INTO attendance (session_id, student_id, present, joined_at, occurrence_date)
       VALUES ($1, $2, TRUE, NOW(), CURRENT_DATE)
       ON CONFLICT ON CONSTRAINT uq_attendance DO NOTHING`,
      [sessionId, userId]
    );
  }

  logger.info(`Agora token generated — session: ${sessionId}, user: ${userId}, uid: ${uid}`);

  return {
    token,
    uid,
    channelName,
    appId: agoraConfig.appId,
    expiresAt: expiresAtTimestamp,
  };
}

/**
 * Revoke all tokens for a session (called when session ends).
 */
async function revokeSessionTokens(sessionId) {
  await db.query(
    `UPDATE agora_tokens
     SET is_revoked = TRUE, updated_at = NOW()
     WHERE session_id = $1 AND is_revoked = FALSE`,
    [sessionId]
  );
  logger.info(`All Agora tokens revoked for session: ${sessionId}`);
}

/**
 * Revoke the token for a specific user leaving a session.
 */
async function revokeUserToken(sessionId, userId) {
  await db.query(
    `UPDATE agora_tokens
     SET is_revoked = TRUE, updated_at = NOW()
     WHERE session_id = $1 AND user_id = $2 AND is_revoked = FALSE`,
    [sessionId, userId]
  );
}

module.exports = { generateToken, revokeSessionTokens, revokeUserToken };