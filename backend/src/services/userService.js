// src/services/userService.js
const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ─── List users with filters, search, pagination ───────────────────────────

const listUsers = async ({ role, status, search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (role) {
    conditions.push(`u.role = $${paramIndex++}`);
    params.push(role);
  }

  if (status) {
    conditions.push(`u.status = $${paramIndex++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(
      `(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count for pagination metadata
  const countResult = await query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Paginated results
  const usersResult = await query(
    `SELECT
       u.id, u.email, u.full_name, u.role, u.status, u.gender,
       u.phone, u.avatar_url, u.nationality, u.preferred_language,
       u.date_of_birth, u.email_verified, u.last_login_at, u.created_at
     FROM users u
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    users: usersResult.rows,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
      has_prev: page > 1,
    },
  };
};

// ─── Dashboard stats ───────────────────────────────────────────────────────

const getUserStats = async () => {
  const result = await query(`
    SELECT
      COUNT(*)                                          AS total_users,
      COUNT(*) FILTER (WHERE role = 'student')          AS total_students,
      COUNT(*) FILTER (WHERE role = 'teacher')          AS total_teachers,
      COUNT(*) FILTER (WHERE role = 'admin')            AS total_admins,
      COUNT(*) FILTER (WHERE status = 'pending')        AS pending_users,
      COUNT(*) FILTER (WHERE status = 'active')         AS active_users,
      COUNT(*) FILTER (WHERE status = 'suspended')      AS suspended_users,
      COUNT(*) FILTER (WHERE status = 'banned')         AS banned_users,
      COUNT(*) FILTER (
        WHERE role = 'teacher' AND status = 'pending'
      )                                                 AS pending_teachers,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '7 days'
      )                                                 AS new_this_week,
      COUNT(*) FILTER (
        WHERE created_at >= NOW() - INTERVAL '30 days'
      )                                                 AS new_this_month
    FROM users
  `);

  // Convert all string counts to integers
  const raw = result.rows[0];
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, parseInt(v, 10)])
  );
};

// ─── Pending teacher approvals ─────────────────────────────────────────────

const getPendingTeachers = async () => {
  const result = await query(`
    SELECT
      u.id, u.email, u.full_name, u.gender, u.nationality,
      u.preferred_language, u.date_of_birth, u.avatar_url,
      u.email_verified, u.created_at,
      tp.bio, tp.qualifications, tp.years_experience,
      tp.specializations, tp.ijazah_chain, tp.ijazah_verified,
      tp.available_days, tp.timezone, tp.cv_url
    FROM users u
    LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
    WHERE u.role = 'teacher' AND u.status = 'pending'
    ORDER BY u.created_at ASC
  `);

  return result.rows;
};

// ─── Get single user with role-specific profile ────────────────────────────

const getUserById = async (userId) => {
  const userResult = await query(
    'SELECT id, role, status FROM users WHERE id = $1',
    [userId]
  );

  const user = userResult.rows[0];
  if (!user) throw new AppError('User not found', 404);

  let profileQuery;

  if (user.role === 'student') {
    profileQuery = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status, u.gender,
        u.phone, u.avatar_url, u.nationality, u.preferred_language,
        u.date_of_birth, u.email_verified, u.last_login_at, u.created_at,
        sp.age, sp.guardian_name, sp.guardian_phone,
        sp.total_juz_memorized, sp.current_level,
        sp.enrollment_date, sp.notes
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1
    `;
  } else if (user.role === 'teacher') {
    profileQuery = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status, u.gender,
        u.phone, u.avatar_url, u.nationality, u.preferred_language,
        u.date_of_birth, u.email_verified, u.last_login_at, u.created_at,
        tp.bio, tp.qualifications, tp.years_experience, tp.specializations,
        tp.ijazah_chain, tp.ijazah_verified, tp.ijazah_verified_at,
        tp.available_days, tp.timezone, tp.max_students, tp.cv_url
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      WHERE u.id = $1
    `;
  } else {
    profileQuery = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status, u.gender,
        u.phone, u.avatar_url, u.nationality, u.preferred_language,
        u.date_of_birth, u.email_verified, u.last_login_at, u.created_at,
        ap.department, ap.permissions, ap.is_super_admin
      FROM users u
      LEFT JOIN admin_profiles ap ON ap.user_id = u.id
      WHERE u.id = $1
    `;
  }

  const result = await query(profileQuery, [userId]);
  return result.rows[0];
};

// ─── Update user status ────────────────────────────────────────────────────

const updateUserStatus = async (targetUserId, newStatus, actorId) => {
  const VALID_STATUSES = ['active', 'suspended', 'banned', 'pending'];

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  // Prevent admin from changing their own status
  if (targetUserId === actorId) {
    throw new AppError('You cannot change your own account status', 400);
  }

  const userResult = await query(
    'SELECT id, role, status, full_name FROM users WHERE id = $1',
    [targetUserId]
  );

  const user = userResult.rows[0];
  if (!user) throw new AppError('User not found', 404);

  // Prevent modifying other admins unless super admin (kept simple for now)
  if (user.role === 'admin') {
    throw new AppError('Cannot modify another admin account', 403);
  }

  if (user.status === newStatus) {
    throw new AppError(`User is already ${newStatus}`, 400);
  }

  await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
    [newStatus, targetUserId]
  );

  // If suspending or banning — revoke all their refresh tokens immediately
  if (newStatus === 'suspended' || newStatus === 'banned') {
    await query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [targetUserId]
    );
  }

  logger.info(`Admin ${actorId} changed user ${targetUserId} status: ${user.status} → ${newStatus}`);

  return { id: targetUserId, previous_status: user.status, new_status: newStatus };
};

// ─── Verify teacher Ijazah ─────────────────────────────────────────────────

const verifyTeacherIjazah = async (teacherId, verifiedBy) => {
  const userResult = await query(
    'SELECT id, role FROM users WHERE id = $1',
    [teacherId]
  );

  const user = userResult.rows[0];
  if (!user) throw new AppError('User not found', 404);
  if (user.role !== 'teacher') throw new AppError('User is not a teacher', 400);

  const profileResult = await query(
    'SELECT ijazah_verified FROM teacher_profiles WHERE user_id = $1',
    [teacherId]
  );

  const profile = profileResult.rows[0];
  if (!profile) throw new AppError('Teacher profile not found', 404);
  if (profile.ijazah_verified) throw new AppError('Ijazah is already verified', 400);

  await query(
    `UPDATE teacher_profiles
     SET ijazah_verified = TRUE, ijazah_verified_by = $1, ijazah_verified_at = NOW()
     WHERE user_id = $2`,
    [verifiedBy, teacherId]
  );

  logger.info(`Admin ${verifiedBy} verified Ijazah for teacher ${teacherId}`);
};

// ─── Soft delete user ──────────────────────────────────────────────────────

const deleteUser = async (targetUserId, actorId) => {
  if (targetUserId === actorId) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const userResult = await query(
    'SELECT id, role, status FROM users WHERE id = $1',
    [targetUserId]
  );

  const user = userResult.rows[0];
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot delete an admin account', 403);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Revoke all tokens
    await client.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1',
      [targetUserId]
    );

    // Soft delete — anonymize the account rather than hard delete
    // This preserves referential integrity across sessions, attendance etc.
    await client.query(
      `UPDATE users SET
         status = 'banned',
         email = $1,
         full_name = 'Deleted User',
         phone = NULL,
         avatar_url = NULL,
         updated_at = NOW()
       WHERE id = $2`,
      [`deleted_${targetUserId}@deleted.invalid`, targetUserId]
    );

    await client.query('COMMIT');

    logger.info(`Admin ${actorId} soft-deleted user ${targetUserId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  listUsers,
  getUserStats,
  getPendingTeachers,
  getUserById,
  updateUserStatus,
  verifyTeacherIjazah,
  deleteUser,
};