// src/services/profileService.js
const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { uploadAvatar, deleteAvatar } = require('./uploadService');

// ─── Get own profile (role-aware join) ────────────────────────────────────

const getOwnProfile = async (userId, role) => {
  let profileQuery;

  if (role === 'student') {
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
  } else if (role === 'teacher') {
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
  const profile = result.rows[0];
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
};

// ─── Update own profile ────────────────────────────────────────────────────

const updateOwnProfile = async (userId, role, updates) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // ── Shared user fields ──
    const userFields = {};
    const allowedUserFields = ['full_name', 'phone', 'nationality', 'preferred_language', 'date_of_birth'];

    allowedUserFields.forEach((field) => {
      if (updates[field] !== undefined) {
        userFields[field] = updates[field];
      }
    });

      // Normalize date_of_birth — strip time component if sent as ISO timestamp
      if (userFields.date_of_birth) {
        userFields.date_of_birth = userFields.date_of_birth.split('T')[0];
      }

    if (Object.keys(userFields).length > 0) {
      const setClauses = Object.keys(userFields)
        .map((field, i) => `${field} = $${i + 2}`)
        .join(', ');

      await client.query(
        `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1`,
        [userId, ...Object.values(userFields)]
      );
    }

    // ── Role-specific profile fields ──
    if (role === 'student') {
      const studentFields = {};
      const allowedStudentFields = ['age', 'guardian_name', 'guardian_phone', 'current_level', 'notes'];

      allowedStudentFields.forEach((field) => {
        if (updates[field] !== undefined) {
          studentFields[field] = updates[field];
        }
      });

      if (Object.keys(studentFields).length > 0) {
        const setClauses = Object.keys(studentFields)
          .map((field, i) => `${field} = $${i + 2}`)
          .join(', ');

        await client.query(
          `UPDATE student_profiles SET ${setClauses}, updated_at = NOW() WHERE user_id = $1`,
          [userId, ...Object.values(studentFields)]
        );
      }
    }

    if (role === 'teacher') {
      const teacherFields = {};
      const allowedTeacherFields = [
        'bio', 'qualifications', 'years_experience', 'specializations',
        'ijazah_chain', 'available_days', 'timezone', 'max_students', 'cv_url',
      ];

      allowedTeacherFields.forEach((field) => {
        if (updates[field] !== undefined) {
          teacherFields[field] = updates[field];
        }
      });

      if (Object.keys(teacherFields).length > 0) {
        const setClauses = Object.keys(teacherFields)
          .map((field, i) => `${field} = $${i + 2}`)
          .join(', ');

        await client.query(
          `UPDATE teacher_profiles SET ${setClauses}, updated_at = NOW() WHERE user_id = $1`,
          [userId, ...Object.values(teacherFields)]
        );
      }
    }

    if (role === 'admin') {
      const adminFields = {};
      const allowedAdminFields = ['department'];

      allowedAdminFields.forEach((field) => {
        if (updates[field] !== undefined) {
          adminFields[field] = updates[field];
        }
      });

      if (Object.keys(adminFields).length > 0) {
        const setClauses = Object.keys(adminFields)
          .map((field, i) => `${field} = $${i + 2}`)
          .join(', ');

        await client.query(
          `UPDATE admin_profiles SET ${setClauses}, updated_at = NOW() WHERE user_id = $1`,
          [userId, ...Object.values(adminFields)]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getOwnProfile(userId, role);
};

// ─── Upload avatar ─────────────────────────────────────────────────────────

const updateAvatar = async (userId, fileBuffer) => {
  if (!fileBuffer) throw new AppError('No image file provided', 400);

  const avatarUrl = await uploadAvatar(fileBuffer, userId);

  await query(
    'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
    [avatarUrl, userId]
  );

  return avatarUrl;
};

// ─── Remove avatar ─────────────────────────────────────────────────────────

const removeAvatar = async (userId) => {
  const result = await query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];

  if (!user?.avatar_url) throw new AppError('No avatar to remove', 400);

  await deleteAvatar(userId);

  await query(
    'UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1',
    [userId]
  );
};

module.exports = { getOwnProfile, updateOwnProfile, updateAvatar, removeAvatar };