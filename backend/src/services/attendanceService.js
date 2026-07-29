const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ─── Attendance ──────────────────────────────────────────────────────────────

const assertTeacherOwnsSession = async (sessionId, teacherId) => {
  const res = await query(
    `SELECT id FROM sessions WHERE id = $1 AND teacher_id = $2`,
    [sessionId, teacherId]
  );
  if (res.rowCount === 0) throw new AppError('Session not found or access denied', 403);
};

const assertTeacherStudentLink = async (studentId, teacherId) => {
  const res = await query(
    `SELECT 1 FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $1 AND s.teacher_id = $2 AND se.status = 'approved'
     LIMIT 1`,
    [studentId, teacherId]
  );
  if (res.rowCount === 0) throw new AppError('Student not found or access denied', 403);
};

/**
 * Returns all approved students for a session with their attendance
 * record for the given occurrence_date (null attendance fields if absent/unmarked).
 */
const getSessionAttendance = async (sessionId, requestingUser, date) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherOwnsSession(sessionId, requestingUser.id);
  }

  const occDate = date || new Date().toISOString().slice(0, 10);

  const res = await query(
    `SELECT
       u.id          AS student_id,
       u.full_name,
       u.avatar_url,
       a.id          AS attendance_id,
       a.present,
       a.joined_at,
       a.left_at,
       a.duration_seconds,
       a.notes,
       a.marked_by,
       a.occurrence_date
     FROM session_enrollments se
     JOIN users u ON u.id = se.student_id
     LEFT JOIN attendance a
       ON a.session_id = se.session_id
      AND a.student_id = se.student_id
      AND a.occurrence_date = $2
     WHERE se.session_id = $1
       AND se.status = 'approved'
     ORDER BY u.full_name`,
    [sessionId, occDate]
  );

  return { date: occDate, students: res.rows };
};

/**
 * Returns all distinct occurrence dates that have at least one attendance
 * record for the session — for the date picker UI.
 */
const getSessionOccurrenceDates = async (sessionId, requestingUser) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherOwnsSession(sessionId, requestingUser.id);
  }

  const res = await query(
    `SELECT DISTINCT occurrence_date
     FROM attendance
     WHERE session_id = $1
     ORDER BY occurrence_date DESC`,
    [sessionId]
  );

  return res.rows.map((r) => r.occurrence_date.toISOString().slice(0, 10));
};

/**
 * UPSERT one student's attendance for a given date.
 * Teacher must own the session.
 */
const upsertStudentAttendance = async (sessionId, studentId, teacherId, data) => {
  await assertTeacherOwnsSession(sessionId, teacherId);

  const occDate = data.date || new Date().toISOString().slice(0, 10);
  const present = data.present ?? false;
  const notes   = data.notes  ?? null;

  const res = await query(
    `INSERT INTO attendance
       (session_id, student_id, present, notes, marked_by, occurrence_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ON CONSTRAINT uq_attendance
     DO UPDATE SET
       present    = EXCLUDED.present,
       notes      = EXCLUDED.notes,
       marked_by  = EXCLUDED.marked_by,
       updated_at = NOW()
     RETURNING *`,
    [sessionId, studentId, present, notes, teacherId, occDate]
  );

  return res.rows[0];
};

/**
 * Student's own paginated attendance history across all sessions.
 * Also returns aggregate counts for rate calculation.
 */
const getMyAttendance = async (studentId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const countRes = await query(
    `SELECT
       COUNT(*)                                        AS total,
       COUNT(*) FILTER (WHERE a.present = TRUE)       AS attended
     FROM attendance a
     WHERE a.student_id = $1`,
    [studentId]
  );

  const { total, attended } = countRes.rows[0];
  const totalInt    = parseInt(total,   10);
  const attendedInt = parseInt(attended, 10);
  const rate_pct    = totalInt > 0 ? Math.round((attendedInt / totalInt) * 100) : null;

  const rowsRes = await query(
    `SELECT
       a.id,
       a.occurrence_date,
       a.present,
       a.duration_seconds,
       a.notes,
       s.id          AS session_id,
       s.title       AS session_title
     FROM attendance a
     JOIN sessions s ON s.id = a.session_id
     WHERE a.student_id = $1
     ORDER BY a.occurrence_date DESC
     LIMIT $2 OFFSET $3`,
    [studentId, limit, offset]
  );

  return {
    total:    totalInt,
    attended: attendedInt,
    rate_pct,
    page,
    limit,
    rows: rowsRes.rows,
  };
};

/**
 * Teacher views a specific student's attendance history.
 * Teacher must have an approved enrollment linking them.
 */
const getStudentAttendance = async (studentId, requestingUser, { page = 1, limit = 20 } = {}) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherStudentLink(studentId, requestingUser.id);
  }

  const offset = (page - 1) * limit;

  const countRes = await query(
    `SELECT
       COUNT(*)                                        AS total,
       COUNT(*) FILTER (WHERE a.present = TRUE)       AS attended
     FROM attendance a
     WHERE a.student_id = $1`,
    [studentId]
  );

  const { total, attended } = countRes.rows[0];
  const totalInt    = parseInt(total,   10);
  const attendedInt = parseInt(attended, 10);
  const rate_pct    = totalInt > 0 ? Math.round((attendedInt / totalInt) * 100) : null;

  const rowsRes = await query(
    `SELECT
       a.id,
       a.occurrence_date,
       a.present,
       a.duration_seconds,
       a.notes,
       a.marked_by,
       s.id          AS session_id,
       s.title       AS session_title
     FROM attendance a
     JOIN sessions s ON s.id = a.session_id
     WHERE a.student_id = $1
     ORDER BY a.occurrence_date DESC
     LIMIT $2 OFFSET $3`,
    [studentId, limit, offset]
  );

  return {
    total:    totalInt,
    attended: attendedInt,
    rate_pct,
    page,
    limit,
    rows: rowsRes.rows,
  };
};

// ─── Progress ────────────────────────────────────────────────────────────────

const getOrCreateProgress = async (studentId) => {
  const res = await query(
    `INSERT INTO progress_records (student_id)
     VALUES ($1)
     ON CONFLICT ON CONSTRAINT uq_progress DO NOTHING
     RETURNING *`,
    [studentId]
  );

  if (res.rowCount > 0) return res.rows[0];

  const existing = await query(
    `SELECT * FROM progress_records WHERE student_id = $1`,
    [studentId]
  );
  return existing.rows[0];
};

const getStudentProgress = async (studentId, requestingUser) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherStudentLink(studentId, requestingUser.id);
  }

  const res = await query(
    `SELECT * FROM progress_records WHERE student_id = $1`,
    [studentId]
  );
  return res.rows[0] || null;
};

const upsertProgress = async (studentId, teacherId, data) => {
  await assertTeacherStudentLink(studentId, teacherId);

  const {
    total_juz_memorized,
    total_surahs_memorized,
    status,
    accuracy_grade,
    teacher_notes,
  } = data;

  const res = await query(
    `INSERT INTO progress_records
       (student_id, teacher_id, total_juz_memorized, total_surahs_memorized,
        status, accuracy_grade, teacher_notes, last_reviewed_at)
     VALUES ($1, $2,
       COALESCE($3, 0), COALESCE($4, 0),
       COALESCE($5::progress_status, 'not_started'), $6::accuracy_grade, $7, NOW())
     ON CONFLICT ON CONSTRAINT uq_progress
     DO UPDATE SET
       teacher_id             = EXCLUDED.teacher_id,
       total_juz_memorized    = COALESCE($3, progress_records.total_juz_memorized),
       total_surahs_memorized = COALESCE($4, progress_records.total_surahs_memorized),
       status                 = COALESCE($5::progress_status, progress_records.status),
       accuracy_grade         = COALESCE($6::accuracy_grade, progress_records.accuracy_grade),
       teacher_notes          = COALESCE($7, progress_records.teacher_notes),
       last_reviewed_at       = NOW(),
       updated_at             = NOW()
     RETURNING *`,
    [
      studentId, teacherId,
      total_juz_memorized  ?? null,
      total_surahs_memorized ?? null,
      status               ?? null,
      accuracy_grade       ?? null,
      teacher_notes        ?? null,
    ]
  );

  const saved = res.rows[0];

  // Keep student_profiles in sync so any query that reads from it stays current.
  if (total_juz_memorized != null) {
    await query(
      `UPDATE student_profiles
       SET total_juz_memorized = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [saved.total_juz_memorized, studentId]
    );
  }

  return saved;
};

// ─── Teacher notes ───────────────────────────────────────────────────────────

const getStudentNotes = async (studentId, requestingUser) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherStudentLink(studentId, requestingUser.id);
  } else if (requestingUser.role === 'student' && requestingUser.id !== studentId) {
    throw new AppError('Access denied', 403);
  }

  const privateFilter = requestingUser.role === 'student' ? 'AND tn.is_private = FALSE' : '';

  const res = await query(
    `SELECT
       tn.id, tn.content, tn.is_private, tn.created_at, tn.session_id,
       u.full_name AS teacher_name
     FROM teacher_notes tn
     JOIN users u ON u.id = tn.teacher_id
     WHERE tn.student_id = $1 ${privateFilter}
     ORDER BY tn.created_at DESC`,
    [studentId]
  );

  return res.rows;
};

const addNote = async (teacherId, studentId, data) => {
  await assertTeacherStudentLink(studentId, teacherId);

  const { content, is_private = false, session_id = null } = data;

  const res = await query(
    `INSERT INTO teacher_notes (teacher_id, student_id, content, is_private, session_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [teacherId, studentId, content, is_private, session_id]
  );

  return res.rows[0];
};

const deleteNote = async (noteId, teacherId) => {
  const res = await query(
    `DELETE FROM teacher_notes WHERE id = $1 AND teacher_id = $2 RETURNING id`,
    [noteId, teacherId]
  );
  if (res.rowCount === 0) throw new AppError('Note not found or access denied', 404);
};

module.exports = {
  getSessionAttendance,
  getSessionOccurrenceDates,
  upsertStudentAttendance,
  getMyAttendance,
  getStudentAttendance,
  getOrCreateProgress,
  getStudentProgress,
  upsertProgress,
  getStudentNotes,
  addNote,
  deleteNote,
};
