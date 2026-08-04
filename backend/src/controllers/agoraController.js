const agoraService = require('../services/agoraService');
const db = require('../config/db');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

async function getToken(req, res, next) {
  try {
    const sessionId = req.params.id;
    const userId    = req.user.id;
    const userRole  = req.user.role;
    const result = await agoraService.generateToken(sessionId, userId, userRole);
    return success(res, result, 'Token generated successfully');
  } catch (err) {
    next(err);
  }
}

async function leaveSession(req, res, next) {
  try {
    const sessionId       = req.params.id;
    const userId          = req.user.id;
    const userRole        = req.user.role;
    const durationSeconds = req.body.duration_seconds ?? 0;

    await agoraService.revokeUserToken(sessionId, userId);

    if (userRole === 'student') {
      await db.query(
        `UPDATE attendance
         SET left_at = NOW(), duration_seconds = $1, updated_at = NOW()
         WHERE session_id = $2 AND student_id = $3 AND occurrence_date = CURRENT_DATE`,
        [durationSeconds, sessionId, userId]
      );
    }

    logger.info(`User ${userId} left session ${sessionId}`);
    return success(res, null, 'Left session successfully');
  } catch (err) {
    next(err);
  }
}

async function endSession(req, res, next) {
  try {
    const sessionId = req.params.id;
    const userId    = req.user.id;
    const userRole  = req.user.role;

    const sessionResult = await db.query(
      `SELECT id, teacher_id, status FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rowCount === 0) return error(res, 'Session not found', 404);

    const session = sessionResult.rows[0];
    if (session.status !== 'live') return error(res, 'Session is not currently live', 400);
    if (userRole === 'teacher' && session.teacher_id !== userId) {
      return error(res, 'You do not have permission to end this session', 403);
    }

    await db.query(
      `UPDATE attendance SET left_at = NOW(), updated_at = NOW()
       WHERE session_id = $1 AND present = TRUE AND left_at IS NULL
         AND occurrence_date = CURRENT_DATE`,
      [sessionId]
    );

    await agoraService.revokeSessionTokens(sessionId);

    await db.query(
      `UPDATE sessions SET status = 'scheduled', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Clear all signals for this session
    await db.query(`DELETE FROM session_signals WHERE session_id = $1`, [sessionId]);

    logger.info(`Session ${sessionId} ended by user ${userId}`);
    return success(res, null, 'Session ended successfully');
  } catch (err) {
    next(err);
  }
}

async function getParticipants(req, res, next) {
  try {
    const sessionId = req.params.id;

    const result = await db.query(
      `SELECT u.id, u.full_name, u.avatar_url, u.role
       FROM sessions s
       JOIN users u ON u.id = s.teacher_id
       WHERE s.id = $1

       UNION ALL

       SELECT u.id, u.full_name, u.avatar_url, u.role
       FROM session_enrollments se
       JOIN users u ON u.id = se.student_id
       WHERE se.session_id = $1 AND se.status = 'approved'
       ORDER BY role DESC, full_name ASC`,
      [sessionId]
    );

    return success(res, result.rows, 'Participants fetched');
  } catch (err) {
    next(err);
  }
}

// ─── Signaling ─────────────────────────────────────────────────────────────
// Lightweight in-DB signaling for hand raise, reactions, and kick commands.
// Replaces Agora RTM to avoid a second SDK dependency.

/**
 * POST /api/sessions/:id/signal
 * Student raises hand or sends a reaction.
 * Body: { type: 'hand_raise' | 'hand_lower' | 'reaction', payload: '👍' }
 */
async function sendSignal(req, res, next) {
  try {
    const sessionId = req.params.id;
    const userId    = req.user.id;
    const { type, payload } = req.body;

    const allowed = ['hand', 'reaction', 'kick'];
    if (!allowed.includes(type)) {
      return error(res, 'Invalid signal type', 400);
    }

    // Only host roles can kick
    if (type === 'kick' && !['teacher', 'admin'].includes(req.user.role)) {
      return error(res, 'Only teachers and admins can kick participants', 403);
    }

    // Hand state: upsert a single row per user per session.
    // payload = 'raised' or 'lowered' — avoids two competing row types.
    if (type === 'hand') {
      await db.query(
        `INSERT INTO session_signals (session_id, user_id, type, payload, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT ON CONSTRAINT uq_hand_signal
         DO UPDATE SET payload = $4, created_at = NOW()`,
        [sessionId, userId, 'hand', payload ?? 'raised']
      );
    } else {
      // Reactions and kick are append-only
      await db.query(
        `INSERT INTO session_signals (session_id, user_id, type, payload, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [sessionId, userId, type, payload ?? null]
      );
    }

    return success(res, null, 'Signal sent');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sessions/:id/signals
 * Poll for active signals since a given timestamp.
 * Query param: since (ISO timestamp, defaults to 10s ago)
 */
async function getSignals(req, res, next) {
  try {
    const sessionId = req.params.id;
    const userId    = req.user.id;
    const since =
      req.query.since && !isNaN(Date.parse(req.query.since))
        ? new Date(req.query.since)
        : new Date(Date.now() - 10000);

    // Active hand raises — users whose current hand payload is 'raised'
    const handRaiseResult = await db.query(
      `SELECT ss.user_id, u.full_name, ss.payload, ss.created_at
       FROM session_signals ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.session_id = $1
         AND ss.type = 'hand'
         AND ss.payload = 'raised'
       ORDER BY ss.created_at ASC`,
      [sessionId]
    );

    const activeHandRaises = handRaiseResult.rows;

    // Recent reactions since last poll
    const reactions = await db.query(
      `SELECT ss.user_id, u.full_name, ss.payload, ss.created_at
       FROM session_signals ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.session_id = $1
         AND ss.type = 'reaction'
         AND ss.created_at > $2
       ORDER BY ss.created_at DESC
       LIMIT 20`,
      [sessionId, since]
    );

    // Kick signals targeting this user
    const kicks = await db.query(
      `SELECT ss.payload AS target_user_id, ss.created_at
       FROM session_signals ss
       WHERE ss.session_id = $1
         AND ss.type = 'kick'
         AND ss.payload = $2
         AND ss.created_at > $3`,
      [sessionId, userId, since]
    );

    return success(res, {
      hand_raises: activeHandRaises,
      reactions:   reactions.rows,
      kicked:      kicks.rowCount > 0,
      server_time: new Date().toISOString(),
    }, 'Signals fetched');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/sessions/:id/signal/hand
 * Host clears a user's hand raise.
 * Body: { user_id }
 */
async function clearHandRaise(req, res, next) {
  try {
    const sessionId   = req.params.id;
    const { user_id } = req.body;
    const userRole    = req.user.role;

    if (!['teacher', 'admin'].includes(userRole)) {
      return error(res, 'Only teachers and admins can clear hand raises', 403);
    }

    await db.query(
      `UPDATE session_signals
       SET payload = 'lowered', created_at = NOW()
       WHERE session_id = $1 AND user_id = $2 AND type = 'hand'`,
      [sessionId, user_id]
    );

    return success(res, null, 'Hand raise cleared');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getToken, leaveSession, endSession, getParticipants,
  sendSignal, getSignals, clearHandRaise,
};