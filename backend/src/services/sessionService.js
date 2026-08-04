// src/services/sessionService.js
const { query, getClient } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notifyHelper');

// ─── Create session (admin only) ───────────────────────────────────────────

const createSession = async (adminId, data) => {
  const {
    title, description, session_type, scheduled_at, session_days,
    duration_minutes = 60, max_students = 10, session_gender,
    session_language, age_range_min, age_range_max, teacher_id,
    agora_channel,
  } = data;

  // Validate teacher exists and is a teacher role if provided
  if (teacher_id) {
    const teacherCheck = await query(
      "SELECT id, role, status FROM users WHERE id = $1 AND role = 'teacher'",
      [teacher_id]
    );
    if (!teacherCheck.rows[0]) {
      throw new AppError('Assigned user is not a valid teacher', 400);
    }
    if (teacherCheck.rows[0].status !== 'active') {
      throw new AppError('Teacher account is not active', 400);
    }
  }

  const channelCheck = await query(
    'SELECT id FROM sessions WHERE agora_channel = $1',
    [agora_channel]
  );
  if (channelCheck.rows[0]) {
    throw new AppError('This Agora channel name is already in use — please choose another', 400);
  }

  const result = await query(
    `INSERT INTO sessions
       (teacher_id, title, description, session_type, status, scheduled_at,
        session_days, duration_minutes, max_students, session_gender,
        session_language, age_range_min, age_range_max, agora_channel)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      teacher_id || null,
      title,
      description || null,
      session_type,
      teacher_id ? 'scheduled' : 'draft',
      scheduled_at,
      session_days,
      duration_minutes,
      max_students,
      session_gender,
      session_language,
      age_range_min || null,
      age_range_max || null,
      agora_channel,
    ]
  );

  logger.info(`Admin ${adminId} created session: ${result.rows[0].id}`);
  return result.rows[0];
};

// ─── List sessions with filters ────────────────────────────────────────────

const listSessions = async ({ role, userId, type, status, gender, language, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  // Role-based visibility
  if (role === 'student') {
    // Students only see scheduled or live sessions
    conditions.push(`s.status IN ('scheduled', 'live')`);
  } else if (role === 'teacher') {
    // Teachers see all non-draft sessions
    conditions.push(`s.status != 'draft'`);
  }
  // Admins see everything

  if (type) {
    conditions.push(`s.session_type = $${idx++}`);
    params.push(type);
  }

  if (status && role === 'admin') {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }

  if (gender) {
    conditions.push(`s.session_gender = $${idx++}`);
    params.push(gender);
  }

  if (language) {
    conditions.push(`s.session_language = $${idx++}`);
    params.push(language);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM sessions s ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const sessionsResult = await query(
    `SELECT
       s.id, s.title, s.description, s.session_type, s.status,
       s.scheduled_at, s.session_days, s.duration_minutes,
       s.max_students, s.session_gender, s.session_language,
       s.age_range_min, s.age_range_max, s.started_at, s.ended_at,
       s.created_at,
       u.id AS teacher_id, u.full_name AS teacher_name,
       u.avatar_url AS teacher_avatar,
       tp.ijazah_verified AS teacher_ijazah_verified,
       (SELECT COUNT(*) FROM session_enrollments se
        WHERE se.session_id = s.id AND se.status = 'approved') AS enrolled_count
     FROM sessions s
     LEFT JOIN users u ON u.id = s.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = s.teacher_id
     ${whereClause}
     ORDER BY s.scheduled_at ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return {
    sessions: sessionsResult.rows,
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

// ─── Get sessions filtered by student profile ──────────────────────────────

const listSessionsForStudent = async (studentId, filters) => {
  // Get student's profile to apply smart matching
  const studentResult = await query(
    `SELECT
       u.gender, u.preferred_language,
       DATE_PART('year', AGE(NOW(), u.date_of_birth))::int AS calculated_age
     FROM users u
     WHERE u.id = $1`,
    [studentId]
  );

  const student = studentResult.rows[0];

  // Apply student's profile as default filters if not explicitly overridden
  const effectiveFilters = {
    gender:   filters.gender   || student?.gender,
    language: filters.language || student?.preferred_language,
    ...filters,
  };

  const offset = (filters.page - 1) * filters.limit;
  const STUDENT_ALLOWED_STATUSES = ['scheduled', 'live'];
  const conditions = [];
  const params = [];
  let idx = 1;

  // Always restrict students to visible statuses; optionally narrow to one
  if (filters.status && STUDENT_ALLOWED_STATUSES.includes(filters.status)) {
    conditions.push(`s.status = $${idx++}`);
    params.push(filters.status);
  } else {
    conditions.push(`s.status IN ('scheduled', 'live')`);
  }

  if (effectiveFilters.gender) {
    conditions.push(`s.session_gender = $${idx++}`);
    params.push(effectiveFilters.gender);
  }

  if (effectiveFilters.language) {
    conditions.push(`s.session_language = $${idx++}`);
    params.push(effectiveFilters.language);
  }

  if (effectiveFilters.type) {
    conditions.push(`s.session_type = $${idx++}`);
    params.push(effectiveFilters.type);
  }

  // Age range matching — session age range must include student's age
  if (student?.calculated_age) {
    conditions.push(
      `(s.age_range_min IS NULL OR s.age_range_min <= $${idx})
       AND (s.age_range_max IS NULL OR s.age_range_max >= $${idx})`
    );
    params.push(student.calculated_age);
    idx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*) FROM sessions s ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const sessionsResult = await query(
    `SELECT
       s.id, s.title, s.description, s.session_type, s.status,
       s.scheduled_at, s.session_days, s.duration_minutes,
       s.max_students, s.session_gender, s.session_language,
       s.age_range_min, s.age_range_max, s.created_at,
       u.id AS teacher_id, u.full_name AS teacher_name,
       u.avatar_url AS teacher_avatar,
       tp.ijazah_verified AS teacher_ijazah_verified,
       tp.specializations AS teacher_specializations,
       (SELECT COUNT(*) FROM session_enrollments se
        WHERE se.session_id = s.id AND se.status = 'approved') AS enrolled_count,
       (SELECT status FROM session_enrollments se2
        WHERE se2.session_id = s.id AND se2.student_id = $${idx}) AS my_enrollment_status
     FROM sessions s
     LEFT JOIN users u ON u.id = s.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = s.teacher_id
     ${whereClause}
     ORDER BY s.scheduled_at ASC
     LIMIT $${idx + 1} OFFSET $${idx + 2}`,
    [...params, studentId, filters.limit, offset]
  );

  return {
    sessions: sessionsResult.rows,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.ceil(total / filters.limit),
      has_next: filters.page < Math.ceil(total / filters.limit),
      has_prev: filters.page > 1,
    },
  };
};

// ─── Get teacher's assigned sessions ──────────────────────────────────────

const getTeacherSessions = async (teacherId) => {
  const result = await query(
    `SELECT
       s.id, s.title, s.session_type, s.status, s.scheduled_at,
       s.session_days, s.duration_minutes, s.max_students,
       s.session_gender, s.session_language, s.age_range_min,
       s.age_range_max, s.created_at,
       (SELECT COUNT(*) FROM session_enrollments se
        WHERE se.session_id = s.id AND se.status = 'approved') AS enrolled_count,
       (SELECT COUNT(*) FROM session_enrollments se2
        WHERE se2.session_id = s.id AND se2.status = 'pending') AS pending_enrollments
     FROM sessions s
     WHERE s.teacher_id = $1 AND s.status != 'cancelled'
     ORDER BY s.scheduled_at ASC`,
    [teacherId]
  );

  return result.rows;
};

// ─── Get session by ID ─────────────────────────────────────────────────────

const getSessionById = async (sessionId, requestingUser) => {
  const result = await query(
    `SELECT
       s.*,
       u.id AS teacher_user_id, u.full_name AS teacher_name,
       u.avatar_url AS teacher_avatar, u.gender AS teacher_gender,
       tp.bio AS teacher_bio, tp.specializations, tp.years_experience,
       tp.ijazah_verified, tp.ijazah_verified_at,
       (SELECT COUNT(*) FROM session_enrollments se
        WHERE se.session_id = s.id AND se.status = 'approved') AS enrolled_count
     FROM sessions s
     LEFT JOIN users u ON u.id = s.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = s.teacher_id
     WHERE s.id = $1`,
    [sessionId]
  );

  const session = result.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  // Students can only see scheduled/live sessions
  if (requestingUser.role === 'student' &&
      !['scheduled', 'live'].includes(session.status)) {
    throw new AppError('Session not found', 404);
  }

  // Teachers can only see non-draft sessions (unless it's their own)
  if (requestingUser.role === 'teacher' &&
      session.status === 'draft' &&
      session.teacher_id !== requestingUser.id) {
    throw new AppError('Session not found', 404);
  }

  // Attach student's own enrollment status if applicable
  if (requestingUser.role === 'student') {
    const enrollment = await query(
      `SELECT status FROM session_enrollments
       WHERE session_id = $1 AND student_id = $2`,
      [sessionId, requestingUser.id]
    );
    session.my_enrollment_status = enrollment.rows[0]?.status || null;
  }

  return session;
};

// ─── Update session (admin only) ───────────────────────────────────────────

const updateSession = async (sessionId, updates) => {
  const sessionResult = await query(
    'SELECT id, status FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  if (['completed', 'cancelled'].includes(session.status)) {
    throw new AppError('Cannot update a completed or cancelled session', 400);
  }

  const allowedFields = [
    'title', 'description', 'session_type', 'scheduled_at', 'session_days',
    'duration_minutes', 'max_students', 'session_gender', 'session_language',
    'age_range_min', 'age_range_max', 'agora_channel',
  ];

  const fields = {};
  allowedFields.forEach((f) => {
    if (updates[f] !== undefined) fields[f] = updates[f];
  });

  if (Object.keys(fields).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const setClauses = Object.keys(fields)
    .map((f, i) => `${f} = $${i + 2}`)
    .join(', ');

  const result = await query(
    `UPDATE sessions SET ${setClauses}, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [sessionId, ...Object.values(fields)]
  );

  return result.rows[0];
};

// ─── Update session status ─────────────────────────────────────────────────

const updateSessionStatus = async (sessionId, newStatus, requestingUser) => {
  const sessionResult = await query(
    'SELECT id, status, teacher_id FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  // Role-based status transition rules
  if (requestingUser.role === 'teacher') {
    if (session.teacher_id !== requestingUser.id) {
        throw new AppError('You are not assigned to this session', 403);
    }
    if (newStatus === 'draft') {
        throw new AppError('Teachers cannot set a session back to draft', 403);
    }
    }

    if (requestingUser.role === 'admin') {
        if (newStatus === 'draft') {
            throw new AppError('Cannot manually set a session back to draft', 400);
        }
    }

  const extraFields = newStatus === 'live'
    ? ', started_at = NOW()'
    : newStatus === 'completed'
    ? ', ended_at = NOW()'
    : '';

  const result = await query(
    `UPDATE sessions SET status = $1${extraFields}, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [newStatus, sessionId]
  );

  logger.info(`Session ${sessionId} status changed to ${newStatus} by ${requestingUser.id}`);

  // Notify enrolled students when session goes live or is cancelled
  if (newStatus === 'live' || newStatus === 'cancelled') {
    const studentsRes = await query(
      `SELECT student_id FROM session_enrollments
       WHERE session_id = $1 AND status = 'approved'`,
      [sessionId]
    );

    const updatedSession = result.rows[0];
    const notifType  = newStatus === 'live' ? 'session_started' : 'session_cancelled';
    const notifTitle = newStatus === 'live'
      ? 'Session is Live'
      : 'Session Cancelled';
    const notifBody  = newStatus === 'live'
      ? `"${updatedSession.title}" has started — join now!`
      : `"${updatedSession.title}" has been cancelled`;

    await Promise.all(
      studentsRes.rows.map((r) =>
        createNotification(r.student_id, notifType, notifTitle, notifBody, {
          session_id: sessionId,
        })
      )
    );
  }

  return result.rows[0];
};

// ─── Assign teacher to session (admin) ────────────────────────────────────

const assignTeacher = async (sessionId, teacherId, adminId) => {
  const sessionResult = await query(
    'SELECT id, status FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  if (['completed', 'cancelled', 'live'].includes(session.status)) {
    throw new AppError(`Cannot assign teacher to a ${session.status} session`, 400);
  }

  const teacherResult = await query(
    "SELECT id, status FROM users WHERE id = $1 AND role = 'teacher'",
    [teacherId]
  );

  const teacher = teacherResult.rows[0];
  if (!teacher) throw new AppError('Teacher not found', 404);
  if (teacher.status !== 'active') throw new AppError('Teacher account is not active', 400);

  const result = await query(
    `UPDATE sessions
     SET teacher_id = $1, status = 'scheduled', updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [teacherId, sessionId]
  );

  logger.info(`Admin ${adminId} assigned teacher ${teacherId} to session ${sessionId}`);
  return result.rows[0];
};

// ─── Teacher requests to teach a session ──────────────────────────────────

const requestToTeach = async (sessionId, teacherId) => {
  const sessionResult = await query(
    'SELECT id, status, teacher_id FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);

  if (session.status !== 'draft') {
    throw new AppError('Session already has a teacher assigned', 400);
  }

  if (session.teacher_id === teacherId) {
    throw new AppError('You have already requested this session', 400);
  }

  // Store request as a pending teacher assignment
  // We reuse teacher_id field but keep status as draft to flag it needs admin approval
  await query(
    `UPDATE sessions
     SET teacher_id = $1, status = 'draft', updated_at = NOW()
     WHERE id = $2`,
    [teacherId, sessionId]
  );

  logger.info(`Teacher ${teacherId} requested to teach session ${sessionId}`);
};

// ─── Admin approves teacher's request ─────────────────────────────────────

const approveTeacherRequest = async (sessionId, adminId) => {
  const sessionResult = await query(
    'SELECT id, status, teacher_id FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);
  if (!session.teacher_id) throw new AppError('No teacher has requested this session', 400);
  if (session.status !== 'draft') throw new AppError('Session has already been processed', 400);

  const result = await query(
    `UPDATE sessions
     SET status = 'scheduled', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [sessionId]
  );

  logger.info(`Admin ${adminId} approved teacher for session ${sessionId}`);
  return result.rows[0];
};

// ─── Get enrolled students with profiles (teacher view) ───────────────────

const getSessionStudents = async (sessionId, teacherId) => {
  const sessionResult = await query(
    'SELECT id, teacher_id FROM sessions WHERE id = $1',
    [sessionId]
  );

  const session = sessionResult.rows[0];
  if (!session) throw new AppError('Session not found', 404);
  if (session.teacher_id !== teacherId) {
    throw new AppError('You are not the teacher of this session', 403);
  }

  const result = await query(
    `SELECT
       se.id          AS enrollment_id,
       se.status      AS enrollment_status,
       se.student_id,
       se.enrolled_at, se.approved_at,
       u.id, u.full_name, u.email, u.avatar_url, u.gender,
       u.preferred_language, u.nationality,
       COALESCE(
         DATE_PART('year', AGE(NOW(), u.date_of_birth))::int,
         sp.age
       )                                               AS age,
       COALESCE(pr.total_juz_memorized,
                sp.total_juz_memorized, 0)             AS total_juz_memorized,
       sp.current_level,
       sp.guardian_name, sp.guardian_phone, sp.notes
     FROM session_enrollments se
     JOIN users u ON u.id = se.student_id
     LEFT JOIN student_profiles sp  ON sp.user_id  = se.student_id
     LEFT JOIN progress_records pr  ON pr.student_id = se.student_id
     WHERE se.session_id = $1
     ORDER BY se.enrolled_at ASC`,
    [sessionId]
  );

  return result.rows;
};

// ─── Get teacher profile (student view) ───────────────────────────────────

const getSessionTeacherProfile = async (sessionId, requestingUser) => {
  // Admins can view any teacher profile; students must be an approved enrollee
  if (requestingUser.role !== 'admin') {
    const enrollmentResult = await query(
      `SELECT se.status FROM session_enrollments se
       WHERE se.session_id = $1 AND se.student_id = $2`,
      [sessionId, requestingUser.id]
    );

    if (enrollmentResult.rows[0]?.status !== 'approved') {
      throw new AppError('You must be enrolled in this session to view the teacher profile', 403);
    }
  }

  const result = await query(
    `SELECT
       u.id, u.full_name, u.avatar_url, u.gender, u.nationality,
       u.preferred_language,
       tp.bio, tp.qualifications, tp.years_experience, tp.specializations,
       tp.ijazah_verified, tp.ijazah_verified_at, tp.available_days, tp.timezone
     FROM sessions s
     JOIN users u ON u.id = s.teacher_id
     LEFT JOIN teacher_profiles tp ON tp.user_id = s.teacher_id
     WHERE s.id = $1`,
    [sessionId]
  );

  const teacher = result.rows[0];
  if (!teacher) throw new AppError('Teacher not found for this session', 404);

  return teacher;
};

module.exports = {
  createSession,
  listSessions,
  listSessionsForStudent,
  getTeacherSessions,
  getSessionById,
  updateSession,
  updateSessionStatus,
  assignTeacher,
  requestToTeach,
  approveTeacherRequest,
  getSessionStudents,
  getSessionTeacherProfile,
};