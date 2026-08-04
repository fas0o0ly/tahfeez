// src/services/enrollmentService.js
const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notifyHelper');

// ─── Student requests to enroll ────────────────────────────────────────────

const requestEnrollment = async (sessionId, studentId) => {
  const sessionResult = await query(
    `SELECT id, status, session_gender, session_language,
            age_range_min, age_range_max, max_students, teacher_id
     FROM sessions WHERE id = $1`,
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  if (!['scheduled', 'live'].includes(session.status)) {
    throw new AppError('This session is not accepting enrollments', 400);
  }

  if (!session.teacher_id) {
    throw new AppError('This session does not have an assigned teacher yet', 400);
  }

  // Get student profile to validate eligibility
  const studentResult = await query(
    `SELECT
       u.gender, u.preferred_language,
       DATE_PART('year', AGE(NOW(), u.date_of_birth))::int AS calculated_age
     FROM users u
     WHERE u.id = $1`,
    [studentId]
  );

  const student = studentResult.rows[0];

  // Gender check
  if (student.gender !== session.session_gender) {
    throw new AppError(
      `This session is for ${session.session_gender} students only`, 400
    );
  }

  // Age range check — calculated from date_of_birth, not manually entered age
  if (student.calculated_age) {
    if (session.age_range_min && student.calculated_age < session.age_range_min) {
      throw new AppError(
        `Minimum age for this session is ${session.age_range_min}`, 400
      );
    }
    if (session.age_range_max && student.calculated_age > session.age_range_max) {
      throw new AppError(
        `Maximum age for this session is ${session.age_range_max}`, 400
      );
    }
  }

  // Check if already enrolled
  const existingResult = await query(
    'SELECT id, status FROM session_enrollments WHERE session_id = $1 AND student_id = $2',
    [sessionId, studentId]
  );

  const existing = existingResult.rows[0];
  if (existing) {
    if (existing.status === 'approved') throw new AppError('You are already enrolled in this session', 400);
    if (existing.status === 'pending') throw new AppError('Your enrollment request is already pending', 400);
    if (existing.status === 'rejected') throw new AppError('Your enrollment was rejected for this session', 400);
  }

  // Check capacity
  const countResult = await query(
    "SELECT COUNT(*) FROM session_enrollments WHERE session_id = $1 AND status = 'approved'",
    [sessionId]
  );

  const enrolledCount = parseInt(countResult.rows[0].count, 10);
  if (enrolledCount >= session.max_students) {
    throw new AppError('This session is full', 400);
  }

  // A previously withdrawn (cancelled) or completed enrollment row already
  // exists for this (session, student) pair — the UNIQUE constraint means
  // we must reuse and reset it rather than INSERT a new one.
  let result;
  if (existing) {
    result = await query(
      `UPDATE session_enrollments
       SET status = 'pending', approved_at = NULL, approved_by = NULL,
           enrolled_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [existing.id]
    );
  } else {
    result = await query(
      `INSERT INTO session_enrollments (session_id, student_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [sessionId, studentId]
    );
  }

  logger.info(`Student ${studentId} requested enrollment in session ${sessionId}`);
  return result.rows[0];
};

// ─── Get all enrollments for a session (admin + teacher) ──────────────────

const getSessionEnrollments = async (sessionId, requestingUser) => {
  // Teachers can only see enrollments for their own sessions
  if (requestingUser.role === 'teacher') {
    const sessionResult = await query(
      'SELECT teacher_id FROM sessions WHERE id = $1',
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session) throw new AppError('Session not found', 404);
    if (session.teacher_id !== requestingUser.id) {
      throw new AppError('You are not the teacher of this session', 403);
    }
  }

  const result = await query(
    `SELECT
       se.id, se.status, se.enrolled_at, se.approved_at,
       u.id AS student_id, u.full_name, u.email, u.avatar_url,
       u.gender, u.preferred_language,
       COALESCE(
         DATE_PART('year', AGE(NOW(), u.date_of_birth))::int,
         sp.age
       )                                              AS age,
       sp.current_level,
       sp.guardian_name, sp.guardian_phone, sp.notes,
       COALESCE(pr.total_juz_memorized,
                sp.total_juz_memorized, 0)            AS total_juz_memorized
     FROM session_enrollments se
     JOIN users u ON u.id = se.student_id
     LEFT JOIN student_profiles sp  ON sp.user_id   = se.student_id
     LEFT JOIN progress_records pr  ON pr.student_id = se.student_id
     WHERE se.session_id = $1
     ORDER BY
       CASE se.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       se.enrolled_at ASC`,
    [sessionId]
  );

  return result.rows;
};

// ─── Teacher approves or rejects a student enrollment ─────────────────────

const updateEnrollmentStatus = async (sessionId, enrollmentId, newStatus, teacherId) => {
  // Confirm teacher owns this session
  const sessionResult = await query(
    'SELECT id, teacher_id, max_students FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);
  if (session.teacher_id !== teacherId) {
    throw new AppError('You are not the teacher of this session', 403);
  }

  const enrollmentResult = await query(
    'SELECT id, status, student_id FROM session_enrollments WHERE id = $1 AND session_id = $2',
    [enrollmentId, sessionId]
  );

  const enrollment = enrollmentResult.rows[0];
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  if (enrollment.status !== 'pending') {
    throw new AppError(`Enrollment has already been ${enrollment.status}`, 400);
  }

  // Check capacity before approving
  if (newStatus === 'approved') {
    const countResult = await query(
      "SELECT COUNT(*) FROM session_enrollments WHERE session_id = $1 AND status = 'approved'",
      [sessionId]
    );
    const enrolledCount = parseInt(countResult.rows[0].count, 10);
    if (enrolledCount >= session.max_students) {
      throw new AppError('Cannot approve — session is already full', 400);
    }
  }

  const result = await query(
    `UPDATE session_enrollments
     SET status = $1,
         approved_by = $2,
         approved_at = ${newStatus === 'approved' ? 'NOW()' : 'NULL'},
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [newStatus, teacherId, enrollmentId]
  );

  logger.info(
    `Teacher ${teacherId} ${newStatus} enrollment ${enrollmentId} in session ${sessionId}`
  );

  // Notify the student about approval / rejection
  const sessionTitleRes = await query('SELECT title FROM sessions WHERE id = $1', [sessionId]);
  const sessionTitle = sessionTitleRes.rows[0]?.title || 'a session';

  if (newStatus === 'approved') {
    await createNotification(
      enrollment.student_id,
      'enrollment_approved',
      'Enrollment Approved',
      `You have been approved for "${sessionTitle}"`,
      { session_id: sessionId }
    );
  } else if (newStatus === 'rejected') {
    await createNotification(
      enrollment.student_id,
      'enrollment_rejected',
      'Enrollment Not Approved',
      `Your request to join "${sessionTitle}" was not approved`,
      { session_id: sessionId }
    );
  }

  return result.rows[0];
};

// ─── Student withdraws from a session ─────────────────────────────────────

const withdrawEnrollment = async (sessionId, studentId) => {
  const enrollmentResult = await query(
    'SELECT id, status FROM session_enrollments WHERE session_id = $1 AND student_id = $2',
    [sessionId, studentId]
  );

  const enrollment = enrollmentResult.rows[0];
  if (!enrollment) throw new AppError('You are not enrolled in this session', 404);

  if (enrollment.status === 'rejected') {
    throw new AppError('Enrollment was already rejected', 400);
  }

  await query(
    "UPDATE session_enrollments SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
    [enrollment.id]
  );

  logger.info(`Student ${studentId} withdrew from session ${sessionId}`);
};

module.exports = {
  requestEnrollment,
  getSessionEnrollments,
  updateEnrollmentStatus,
  withdrawEnrollment,
};