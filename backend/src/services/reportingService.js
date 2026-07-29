const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const periodFilter = (period, column = 'occurrence_date') => {
  switch (period) {
    case 'week':  return `AND ${column} >= NOW() - INTERVAL '7 days'`;
    case 'month': return `AND DATE_TRUNC('month', ${column}) = DATE_TRUNC('month', NOW())`;
    case 'year':  return `AND DATE_TRUNC('year',  ${column}) = DATE_TRUNC('year',  NOW())`;
    default:      return '';
  }
};

const assertTeacherOwnsStudent = async (studentId, teacherId) => {
  const res = await query(
    `SELECT 1 FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $1 AND s.teacher_id = $2 AND se.status = 'approved'
     LIMIT 1`,
    [studentId, teacherId]
  );
  if (res.rowCount === 0) throw new AppError('Student not found or access denied', 403);
};

const assertTeacherOwnsSession = async (sessionId, teacherId) => {
  const res = await query(
    'SELECT id FROM sessions WHERE id = $1 AND teacher_id = $2',
    [sessionId, teacherId]
  );
  if (res.rowCount === 0) throw new AppError('Session not found or access denied', 403);
};

const weekLabel = (dateStr) => {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day   = d.getDate();
  return `${month} ${day}`;
};

// ─── Organisation Stats (admin) ───────────────────────────────────────────────

const getOrgStats = async (period) => {
  const pf = periodFilter(period, 'a.occurrence_date');
  const uf = periodFilter(period, 'u.created_at');
  const af = periodFilter(period, 'a.occurrence_date');

  const [
    usersRes, attendRes, activeRes,
    countriesRes, memRes, completedRes,
    certifiedRes, progRes, medalsRes,
    sessionsRes,
  ] = await Promise.all([
    // Users breakdown
    query(`SELECT
       COUNT(*) FILTER (WHERE role = 'student' AND status = 'active') AS total_students,
       COUNT(*) FILTER (WHERE role = 'teacher' AND status = 'active') AS total_teachers
     FROM users`),

    // Instruction hours & overall attendance
    query(`SELECT
       ROUND(SUM(a.duration_seconds) FILTER (WHERE a.present = TRUE) / 3600.0, 1) AS total_hours,
       COUNT(*) AS total_records,
       COUNT(*) FILTER (WHERE a.present = TRUE) AS present_records
     FROM attendance a
     WHERE 1=1 ${pf}`),

    // Weekly active students
    query(`SELECT COUNT(DISTINCT student_id) AS weekly_active
     FROM attendance
     WHERE occurrence_date >= NOW() - INTERVAL '7 days' AND present = TRUE`),

    // Countries
    query(`SELECT COUNT(DISTINCT nationality) AS countries
     FROM users WHERE role = 'student' AND nationality IS NOT NULL AND status = 'active'`),

    // System-wide juz memorized
    query(`SELECT COALESCE(SUM(total_juz_memorized), 0) AS system_juz
     FROM progress_records`),

    // Students who completed Quran
    query(`SELECT COUNT(*) AS completed
     FROM progress_records WHERE status IN ('completed', 'certified')`),

    // Certified students
    query(`SELECT COUNT(*) AS certified FROM progress_records WHERE status = 'certified'`),

    // Overall attendance pct (period filtered)
    query(`SELECT
       ROUND(COUNT(*) FILTER (WHERE present = TRUE)::numeric /
         NULLIF(COUNT(*), 0) * 100) AS attendance_pct
     FROM attendance a WHERE 1=1 ${pf}`),

    // Students with medals
    query(`SELECT COUNT(DISTINCT student_id) AS with_medals FROM student_achievements`),

    // Active sessions
    query(`SELECT COUNT(*) AS total_sessions FROM sessions WHERE status NOT IN ('cancelled', 'draft')`),
  ]);

  const u   = usersRes.rows[0];
  const att = attendRes.rows[0];
  const tot = parseInt(att.total_records, 10);
  const pre = parseInt(att.present_records, 10);

  return {
    total_students:          parseInt(u.total_students, 10),
    total_teachers:          parseInt(u.total_teachers, 10),
    total_sessions:          parseInt(sessionsRes.rows[0].total_sessions, 10),
    total_instruction_hours: parseFloat(att.total_hours) || 0,
    weekly_active_students:  parseInt(activeRes.rows[0].weekly_active, 10),
    countries_represented:   parseInt(countriesRes.rows[0].countries, 10),
    system_memorized_juz:    parseFloat(memRes.rows[0].system_juz) || 0,
    students_completed_quran:parseInt(completedRes.rows[0].completed, 10),
    certified_students:      parseInt(certifiedRes.rows[0].certified, 10),
    overall_attendance_pct:  parseInt(progRes.rows[0].attendance_pct, 10) || 0,
    students_with_medals:    parseInt(medalsRes.rows[0].with_medals, 10),
  };
};

const getOrgAttendanceTrend = async () => {
  const res = await query(
    `SELECT
       DATE_TRUNC('week', occurrence_date)  AS week,
       COUNT(*) FILTER (WHERE present = TRUE)  AS present,
       COUNT(*) FILTER (WHERE present = FALSE) AS absent
     FROM attendance
     WHERE occurrence_date >= NOW() - INTERVAL '84 days'
     GROUP BY week
     ORDER BY week ASC`
  );
  return res.rows.map((r) => ({
    week:    weekLabel(r.week),
    present: parseInt(r.present, 10),
    absent:  parseInt(r.absent, 10),
  }));
};

const getStudentLevelDistribution = async () => {
  const res = await query(
    `SELECT
       COALESCE(sp.current_level, 'unknown') AS level,
       COUNT(*) AS count
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.role = 'student' AND u.status = 'active'
     GROUP BY sp.current_level`
  );
  return res.rows.map((r) => ({
    name:  r.level.charAt(0).toUpperCase() + r.level.slice(1),
    value: parseInt(r.count, 10),
  }));
};

// ─── Student Report ───────────────────────────────────────────────────────────

const getStudentReport = async (studentId, requestingUser, period) => {
  if (requestingUser.role === 'student' && requestingUser.id !== studentId) {
    throw new AppError('Access denied', 403);
  }
  if (requestingUser.role === 'teacher') {
    await assertTeacherOwnsStudent(studentId, requestingUser.id);
  }

  const pf = periodFilter(period, 'a.occurrence_date');
  const af = periodFilter(period, 'ra.created_at');

  const [
    profileRes, attStatsRes, progRes,
    attTrendRes, assTrendRes, recentRes,
    certRes, medalRes,
  ] = await Promise.all([
    // Profile
    query(
      `SELECT u.full_name, u.avatar_url, u.nationality,
              u.gender, u.preferred_language, u.email,
              sp.current_level, sp.guardian_name,
              COALESCE(DATE_PART('year', AGE(NOW(), u.date_of_birth))::int, sp.age) AS age
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [studentId]
    ),

    // Attendance stats
    query(
      `SELECT
         COUNT(*)                                           AS total,
         COUNT(*) FILTER (WHERE a.present = TRUE)          AS attended,
         COUNT(*) FILTER (WHERE a.present = FALSE)         AS absent,
         ROUND(COUNT(*) FILTER (WHERE a.present = FALSE)::numeric /
           NULLIF(COUNT(*), 0) * 100)                      AS absent_pct,
         ROUND(COUNT(*) FILTER (WHERE a.present = TRUE)::numeric /
           NULLIF(COUNT(*), 0) * 100)                      AS attend_pct,
         ROUND(COALESCE(SUM(a.duration_seconds) FILTER (WHERE a.present = TRUE), 0) / 3600.0, 1)
                                                            AS total_hours
       FROM attendance a
       WHERE a.student_id = $1 ${pf}`,
      [studentId]
    ),

    // Progress
    query(
      `SELECT total_juz_memorized, total_surahs_memorized,
              status, accuracy_grade, last_reviewed_at
       FROM progress_records WHERE student_id = $1`,
      [studentId]
    ),

    // Attendance trend by week
    query(
      `SELECT
         DATE_TRUNC('week', a.occurrence_date)           AS week,
         COUNT(*) FILTER (WHERE a.present = TRUE)        AS present,
         COUNT(*) FILTER (WHERE a.present = FALSE)       AS absent
       FROM attendance a
       WHERE a.student_id = $1
         AND a.occurrence_date >= NOW() - INTERVAL '84 days'
       GROUP BY week ORDER BY week ASC`,
      [studentId]
    ),

    // Assessment score trend by week
    query(
      `SELECT
         DATE_TRUNC('week', ra.created_at)               AS week,
         ROUND(AVG(ra.overall_score), 1)                 AS avg_score,
         COUNT(*)                                         AS count
       FROM recitation_assessments ra
       WHERE ra.student_id = $1
         AND ra.status = 'completed'
         AND ra.overall_score IS NOT NULL
         ${af}
         AND ra.created_at >= NOW() - INTERVAL '84 days'
       GROUP BY week ORDER BY week ASC`,
      [studentId]
    ),

    // Recent attendance rows
    query(
      `SELECT
         a.occurrence_date, a.present, a.duration_seconds,
         s.title AS session_title
       FROM attendance a
       JOIN sessions s ON s.id = a.session_id
       WHERE a.student_id = $1
       ORDER BY a.occurrence_date DESC
       LIMIT 20`,
      [studentId]
    ),

    // Certificate count
    query('SELECT COUNT(*) AS count FROM certificates WHERE student_id = $1', [studentId]),

    // Medal count
    query('SELECT COUNT(*) AS count FROM student_achievements WHERE student_id = $1', [studentId]),
  ]);

  const profile  = profileRes.rows[0] || {};
  const attStats = attStatsRes.rows[0] || {};
  const prog     = progRes.rows[0] || {};

  return {
    profile,
    stats: {
      total_sessions:   parseInt(attStats.total, 10) || 0,
      attended:         parseInt(attStats.attended, 10) || 0,
      absent_days:      parseInt(attStats.absent, 10) || 0,
      absent_pct:       parseInt(attStats.absent_pct, 10) || 0,
      attend_pct:       parseInt(attStats.attend_pct, 10) || 0,
      total_hours:      parseFloat(attStats.total_hours) || 0,
      total_juz:        parseFloat(prog.total_juz_memorized) || 0,
      total_surahs:     parseInt(prog.total_surahs_memorized, 10) || 0,
      progress_status:  prog.status || 'not_started',
      accuracy_grade:   prog.accuracy_grade || null,
      cert_count:       parseInt(certRes.rows[0].count, 10),
      medal_count:      parseInt(medalRes.rows[0].count, 10),
    },
    attendance_trend: attTrendRes.rows.map((r) => ({
      week:    weekLabel(r.week),
      present: parseInt(r.present, 10),
      absent:  parseInt(r.absent, 10),
    })),
    assessment_trend: assTrendRes.rows.map((r) => ({
      week:      weekLabel(r.week),
      avg_score: parseFloat(r.avg_score) || 0,
      count:     parseInt(r.count, 10),
    })),
    recent_attendance: recentRes.rows,
  };
};

// ─── Session Report ───────────────────────────────────────────────────────────

const getSessionReport = async (sessionId, requestingUser, period) => {
  if (requestingUser.role === 'teacher') {
    await assertTeacherOwnsSession(sessionId, requestingUser.id);
  }

  const pf = periodFilter(period, 'a.occurrence_date');

  const [
    sessionRes, attStatsRes, attTrendRes,
    levelRes, topRes, certRes,
  ] = await Promise.all([
    // Session info
    query(
      `SELECT s.title, s.scheduled_at, s.duration_minutes, s.session_type,
              s.session_language, s.max_students,
              u.full_name AS teacher_name
       FROM sessions s LEFT JOIN users u ON u.id = s.teacher_id
       WHERE s.id = $1`,
      [sessionId]
    ),

    // Attendance stats
    query(
      `SELECT
         COUNT(DISTINCT a.occurrence_date)                AS total_occurrences,
         COUNT(DISTINCT a.student_id)                    AS enrolled_students,
         COUNT(*) FILTER (WHERE a.present = TRUE)        AS present_records,
         COUNT(*)                                         AS total_records,
         ROUND(COUNT(*) FILTER (WHERE a.present = TRUE)::numeric /
           NULLIF(COUNT(*), 0) * 100)                    AS attendance_pct,
         ROUND(COALESCE(SUM(a.duration_seconds) FILTER (WHERE a.present = TRUE), 0) / 3600.0, 1)
                                                          AS total_hours
       FROM attendance a
       WHERE a.session_id = $1 ${pf}`,
      [sessionId]
    ),

    // Attendance by occurrence date
    query(
      `SELECT
         a.occurrence_date,
         COUNT(*)                                  AS total,
         COUNT(*) FILTER (WHERE a.present = TRUE)  AS present
       FROM attendance a
       WHERE a.session_id = $1 ${pf}
       GROUP BY a.occurrence_date
       ORDER BY a.occurrence_date ASC`,
      [sessionId]
    ),

    // Students by level
    query(
      `SELECT
         COALESCE(sp.current_level, 'unknown') AS level,
         COUNT(*) AS count
       FROM session_enrollments se
       LEFT JOIN student_profiles sp ON sp.user_id = se.student_id
       WHERE se.session_id = $1 AND se.status = 'approved'
       GROUP BY sp.current_level`,
      [sessionId]
    ),

    // Top students by attendance
    query(
      `SELECT
         u.full_name, u.avatar_url,
         COUNT(*) FILTER (WHERE a.present = TRUE)  AS attended,
         COUNT(*)                                   AS total
       FROM attendance a
       JOIN users u ON u.id = a.student_id
       WHERE a.session_id = $1 ${pf}
       GROUP BY u.full_name, u.avatar_url
       ORDER BY attended DESC
       LIMIT 10`,
      [sessionId]
    ),

    // Certificates issued for this session
    query(
      'SELECT COUNT(*) AS count FROM certificates WHERE session_id = $1',
      [sessionId]
    ),
  ]);

  const session  = sessionRes.rows[0];
  if (!session) throw new AppError('Session not found', 404);
  const attStats = attStatsRes.rows[0] || {};

  return {
    session,
    stats: {
      total_occurrences:  parseInt(attStats.total_occurrences, 10) || 0,
      enrolled_students:  parseInt(attStats.enrolled_students, 10) || 0,
      attendance_pct:     parseInt(attStats.attendance_pct, 10) || 0,
      total_hours:        parseFloat(attStats.total_hours) || 0,
      cert_count:         parseInt(certRes.rows[0].count, 10),
    },
    attendance_trend: attTrendRes.rows.map((r) => ({
      date:    r.occurrence_date.toISOString().slice(0, 10),
      label:   weekLabel(r.occurrence_date),
      total:   parseInt(r.total, 10),
      present: parseInt(r.present, 10),
      absent:  parseInt(r.total, 10) - parseInt(r.present, 10),
    })),
    students_by_level: levelRes.rows.map((r) => ({
      name:  r.level.charAt(0).toUpperCase() + r.level.slice(1),
      value: parseInt(r.count, 10),
    })),
    top_students: topRes.rows.map((r) => ({
      ...r,
      attended: parseInt(r.attended, 10),
      total:    parseInt(r.total, 10),
      pct: Math.round((parseInt(r.attended, 10) / Math.max(parseInt(r.total, 10), 1)) * 100),
    })),
  };
};

// ─── Teacher Report ───────────────────────────────────────────────────────────

const getTeacherReport = async (teacherId, requestingUser, period) => {
  if (requestingUser.role === 'teacher' && requestingUser.id !== teacherId) {
    throw new AppError('Access denied', 403);
  }

  const pf = periodFilter(period, 'a.occurrence_date');

  const [profileRes, sessionsRes, studentsRes, hoursRes, progressRes] = await Promise.all([
    query(
      `SELECT u.full_name, u.avatar_url, tp.years_experience, tp.specializations
       FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1`,
      [teacherId]
    ),
    query(
      `SELECT COUNT(*) AS count FROM sessions
       WHERE teacher_id = $1 AND status NOT IN ('cancelled', 'draft')`,
      [teacherId]
    ),
    query(
      `SELECT COUNT(DISTINCT se.student_id) AS count
       FROM session_enrollments se
       JOIN sessions s ON s.id = se.session_id
       WHERE s.teacher_id = $1 AND se.status = 'approved'`,
      [teacherId]
    ),
    query(
      `SELECT ROUND(COALESCE(SUM(a.duration_seconds) FILTER (WHERE a.present = TRUE), 0) / 3600.0, 1) AS hours
       FROM attendance a
       JOIN sessions s ON s.id = a.session_id
       WHERE s.teacher_id = $1 ${pf}`,
      [teacherId]
    ),
    // Student progress distribution by juz ranges
    query(
      `SELECT
         CASE
           WHEN pr.total_juz_memorized = 0         THEN 'Not started'
           WHEN pr.total_juz_memorized <= 5         THEN '1–5 Juz'
           WHEN pr.total_juz_memorized <= 10        THEN '6–10 Juz'
           WHEN pr.total_juz_memorized <= 15        THEN '11–15 Juz'
           WHEN pr.total_juz_memorized <= 20        THEN '16–20 Juz'
           WHEN pr.total_juz_memorized <= 25        THEN '21–25 Juz'
           ELSE '26–30 Juz'
         END AS juz_range,
         COUNT(*) AS count
       FROM session_enrollments se
       JOIN sessions s ON s.id = se.session_id
       LEFT JOIN progress_records pr ON pr.student_id = se.student_id
       WHERE s.teacher_id = $1 AND se.status = 'approved'
       GROUP BY juz_range
       ORDER BY MIN(COALESCE(pr.total_juz_memorized, 0))`,
      [teacherId]
    ),
  ]);

  const profile = profileRes.rows[0] || {};

  return {
    profile,
    stats: {
      sessions_count:     parseInt(sessionsRes.rows[0].count, 10),
      total_students:     parseInt(studentsRes.rows[0].count, 10),
      total_hours_taught: parseFloat(hoursRes.rows[0].hours) || 0,
    },
    student_progress_distribution: progressRes.rows.map((r) => ({
      name:  r.juz_range,
      value: parseInt(r.count, 10),
    })),
  };
};

// ─── Public Stats (no auth) ───────────────────────────────────────────────────

const getPublicStats = async () => {
  const [usersRes, sessionsRes, countriesRes, juzRes] = await Promise.all([
    query(`SELECT
       COUNT(*) FILTER (WHERE role = 'student' AND status = 'active') AS total_students,
       COUNT(*) FILTER (WHERE role = 'teacher' AND status = 'active') AS total_teachers
     FROM users`),
    query(`SELECT COUNT(*) AS total_sessions FROM sessions WHERE status != 'cancelled'`),
    query(`SELECT COUNT(DISTINCT nationality) AS countries FROM users WHERE role = 'student' AND nationality IS NOT NULL AND nationality != ''`),
    query(`SELECT COALESCE(SUM(total_juz_memorized), 0) AS total_juz FROM progress_records`),
  ]);

  return {
    total_students:  parseInt(usersRes.rows[0].total_students, 10)  || 0,
    total_teachers:  parseInt(usersRes.rows[0].total_teachers, 10)  || 0,
    total_sessions:  parseInt(sessionsRes.rows[0].total_sessions, 10) || 0,
    countries:       parseInt(countriesRes.rows[0].countries, 10)   || 0,
    juz_memorized:   Math.round(parseFloat(juzRes.rows[0].total_juz)) || 0,
  };
};

module.exports = {
  getOrgStats,
  getOrgAttendanceTrend,
  getStudentLevelDistribution,
  getStudentReport,
  getSessionReport,
  getTeacherReport,
  getPublicStats,
};
