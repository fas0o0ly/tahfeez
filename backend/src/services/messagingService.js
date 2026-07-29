const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifyHelper');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Admins can message anyone. Teachers and students can only message
 * users they share an approved session enrollment with.
 */
const assertCanMessage = async (senderId, recipientId, senderRole) => {
  if (senderRole === 'admin') return;

  const res = await query(
    `SELECT 1
     FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $1
       AND s.teacher_id = $2
       AND se.status = 'approved'
     UNION
     SELECT 1
     FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $2
       AND s.teacher_id = $1
       AND se.status = 'approved'
     LIMIT 1`,
    [senderId, recipientId]
  );

  if (res.rowCount === 0) {
    throw new AppError('You can only message users you share an active session with', 403);
  }
};

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Returns the inbox as one row per conversation (latest message per other party).
 * box = 'inbox' → conversations where I am recipient
 * box = 'sent'  → conversations where I am sender
 */
const getInbox = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const res = await query(
    `SELECT DISTINCT ON (other_user_id)
       other_user_id,
       other_name,
       other_avatar,
       last_content,
       last_sent_at,
       unread_count
     FROM (
       SELECT
         CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS other_user_id,
         CASE WHEN m.sender_id = $1 THEN ru.full_name    ELSE su.full_name  END AS other_name,
         CASE WHEN m.sender_id = $1 THEN ru.avatar_url   ELSE su.avatar_url END AS other_avatar,
         m.content  AS last_content,
         m.created_at AS last_sent_at,
         (SELECT COUNT(*)
          FROM messages um
          WHERE um.sender_id != $1
            AND um.recipient_id = $1
            AND um.is_read = FALSE
            AND (
              (um.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
            )
            AND um.deleted_by_recipient = FALSE
         ) AS unread_count
       FROM messages m
       JOIN users su ON su.id = m.sender_id
       JOIN users ru ON ru.id = m.recipient_id
       WHERE (m.sender_id = $1 AND m.deleted_by_sender = FALSE)
          OR (m.recipient_id = $1 AND m.deleted_by_recipient = FALSE)
       ORDER BY m.created_at DESC
     ) sub
     ORDER BY other_user_id, last_sent_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return res.rows;
};

/**
 * Fetch all messages between two users, mark incoming ones as read.
 */
const getConversation = async (userId, otherUserId) => {
  const res = await query(
    `SELECT
       m.id, m.sender_id, m.recipient_id, m.subject, m.content,
       m.is_read, m.read_at, m.parent_message_id, m.created_at,
       su.full_name AS sender_name, su.avatar_url AS sender_avatar,
       ru.full_name AS recipient_name, ru.avatar_url AS recipient_avatar
     FROM messages m
     JOIN users su ON su.id = m.sender_id
     JOIN users ru ON ru.id = m.recipient_id
     WHERE (
       (m.sender_id = $1 AND m.recipient_id = $2 AND m.deleted_by_sender = FALSE)
       OR
       (m.sender_id = $2 AND m.recipient_id = $1 AND m.deleted_by_recipient = FALSE)
     )
     ORDER BY m.created_at ASC`,
    [userId, otherUserId]
  );

  // Mark unread messages sent TO me as read
  await query(
    `UPDATE messages
     SET is_read = TRUE, read_at = NOW()
     WHERE recipient_id = $1
       AND sender_id   = $2
       AND is_read = FALSE`,
    [userId, otherUserId]
  );

  return res.rows;
};

/**
 * Send a new message and fire a new_message notification.
 */
const sendMessage = async (senderId, senderRole, data) => {
  const { recipient_id, content, subject = null, parent_message_id = null } = data;

  await assertCanMessage(senderId, recipient_id, senderRole);

  const res = await query(
    `INSERT INTO messages
       (sender_id, recipient_id, subject, content, parent_message_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [senderId, recipient_id, subject, content, parent_message_id]
  );

  const msg = res.rows[0];

  // Fetch sender name for notification body
  const senderRes = await query('SELECT full_name FROM users WHERE id = $1', [senderId]);
  const senderName = senderRes.rows[0]?.full_name || 'Someone';

  await createNotification(
    recipient_id,
    'new_message',
    `New message from ${senderName}`,
    subject ? `Re: ${subject} — ${content.slice(0, 80)}` : content.slice(0, 100),
    { message_id: msg.id, sender_id: senderId }
  );

  return msg;
};

/**
 * Soft-delete a message for the requesting user's side only.
 */
const softDeleteMessage = async (messageId, userId) => {
  // Try sender-side delete
  const senderRes = await query(
    `UPDATE messages SET deleted_by_sender = TRUE
     WHERE id = $1 AND sender_id = $2
     RETURNING id`,
    [messageId, userId]
  );

  if (senderRes.rowCount > 0) return;

  // Try recipient-side delete
  const recipRes = await query(
    `UPDATE messages SET deleted_by_recipient = TRUE
     WHERE id = $1 AND recipient_id = $2
     RETURNING id`,
    [messageId, userId]
  );

  if (recipRes.rowCount === 0) {
    throw new AppError('Message not found or access denied', 404);
  }
};

/**
 * Returns the list of users the current user can start a conversation with.
 * Teachers: their enrolled students. Students: their teachers. Admins: all users.
 */
const getContactableUsers = async (userId, userRole) => {
  if (userRole === 'admin') {
    const res = await query(
      `SELECT id, full_name, avatar_url, role FROM users
       WHERE id != $1 AND status = 'active'
       ORDER BY full_name ASC`,
      [userId]
    );
    return res.rows;
  }

  const res = await query(
    `SELECT DISTINCT u.id, u.full_name, u.avatar_url, u.role
     FROM users u
     JOIN sessions s ON (
       ($1 = s.teacher_id AND EXISTS (
         SELECT 1 FROM session_enrollments se
         WHERE se.session_id = s.id AND se.student_id = u.id AND se.status = 'approved'
       ))
       OR
       ($1 != s.teacher_id AND u.id = s.teacher_id AND EXISTS (
         SELECT 1 FROM session_enrollments se
         WHERE se.session_id = s.id AND se.student_id = $1 AND se.status = 'approved'
       ))
     )
     WHERE u.id != $1 AND u.status = 'active'
     ORDER BY u.full_name ASC`,
    [userId]
  );

  return res.rows;
};

// ─── Notifications ────────────────────────────────────────────────────────────

const getNotifications = async (userId, { unreadOnly = false, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const filter = unreadOnly ? 'AND is_read = FALSE' : '';

  const countRes = await query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 ${filter}`,
    [userId]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const res = await query(
    `SELECT id, title, body, type, is_read, read_at, meta, created_at
     FROM notifications
     WHERE user_id = $1 ${filter}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    rows: res.rows,
  };
};

const getUnreadCount = async (userId) => {
  const res = await query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(res.rows[0].count, 10);
};

const getRecentNotifications = async (userId, limit = 8) => {
  const res = await query(
    `SELECT id, title, body, type, is_read, read_at, meta, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows;
};

const markNotificationRead = async (notificationId, userId) => {
  const res = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );
  if (res.rowCount === 0) throw new AppError('Notification not found', 404);
};

const markAllNotificationsRead = async (userId) => {
  await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
};

const deleteNotification = async (notificationId, userId) => {
  const res = await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [notificationId, userId]
  );
  if (res.rowCount === 0) throw new AppError('Notification not found', 404);
};

module.exports = {
  getInbox,
  getConversation,
  sendMessage,
  softDeleteMessage,
  getContactableUsers,
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
