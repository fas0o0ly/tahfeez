const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notifyHelper');

// ─── Auth helpers ─────────────────────────────────────────────────────────────

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

const assertStudentOrTeacherOrAdmin = async (studentId, requestingUser) => {
  if (requestingUser.role === 'admin') return;
  if (requestingUser.role === 'student' && requestingUser.id === studentId) return;
  if (requestingUser.role === 'teacher') {
    await assertTeacherStudentLink(studentId, requestingUser.id);
    return;
  }
  throw new AppError('Access denied', 403);
};

// ─── Certificates ─────────────────────────────────────────────────────────────

const getStudentCertificates = async (studentId, requestingUser) => {
  await assertStudentOrTeacherOrAdmin(studentId, requestingUser);

  const res = await query(
    `SELECT
       c.id, c.certificate_type, c.title, c.description,
       c.juz_from, c.juz_to, c.accuracy_grade,
       c.certificate_url, c.issued_at,
       u.full_name AS issued_by_name, u.avatar_url AS issued_by_avatar
     FROM certificates c
     JOIN users u ON u.id = c.issued_by
     WHERE c.student_id = $1
     ORDER BY c.issued_at DESC`,
    [studentId]
  );
  return res.rows;
};

const issueCertificate = async (issuedBy, issuerRole, studentId, data) => {
  if (issuerRole === 'teacher') {
    await assertTeacherStudentLink(studentId, issuedBy);
  }

  const {
    certificate_type, title, description = null,
    juz_from = null, juz_to = null,
    accuracy_grade = null, session_id = null,
    certificate_url = null,
  } = data;

  const studentRes = await query('SELECT full_name FROM users WHERE id = $1', [studentId]);
  const studentName = studentRes.rows[0]?.full_name || 'Student';

  const res = await query(
    `INSERT INTO certificates
       (student_id, issued_by, session_id, certificate_type, title,
        description, juz_from, juz_to, accuracy_grade, certificate_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::accuracy_grade, $10)
     RETURNING *`,
    [
      studentId, issuedBy, session_id, certificate_type, title,
      description, juz_from, juz_to, accuracy_grade, certificate_url,
    ]
  );

  await createNotification(
    studentId,
    'system',
    'Certificate Issued 🎓',
    `You have received a certificate: "${title}"`,
    { certificate_id: res.rows[0].id }
  );

  return res.rows[0];
};

const revokeCertificate = async (certId, adminId) => {
  const res = await query(
    'DELETE FROM certificates WHERE id = $1 RETURNING id',
    [certId]
  );
  if (res.rowCount === 0) throw new AppError('Certificate not found', 404);
};

// ─── Achievement types ────────────────────────────────────────────────────────

const getAchievementTypes = async () => {
  const res = await query(
    'SELECT * FROM achievement_types ORDER BY created_at ASC'
  );
  return res.rows;
};

// ─── Achievements / Medals ────────────────────────────────────────────────────

const getStudentAchievements = async (studentId, requestingUser) => {
  await assertStudentOrTeacherOrAdmin(studentId, requestingUser);

  const res = await query(
    `SELECT
       sa.id, sa.awarded_at, sa.notes,
       at.code, at.name, at.name_ar, at.description, at.icon, at.color,
       u.full_name AS awarded_by_name
     FROM student_achievements sa
     JOIN achievement_types at ON at.id = sa.achievement_type_id
     LEFT JOIN users u ON u.id = sa.awarded_by
     WHERE sa.student_id = $1
     ORDER BY sa.awarded_at DESC`,
    [studentId]
  );
  return res.rows;
};

const awardMedal = async (awardedBy, awarderRole, studentId, data) => {
  if (awarderRole === 'teacher') {
    await assertTeacherStudentLink(studentId, awardedBy);
  }

  const { achievement_type_id, notes = null, session_id = null } = data;

  // Verify achievement type exists
  const typeRes = await query(
    'SELECT name FROM achievement_types WHERE id = $1',
    [achievement_type_id]
  );
  if (typeRes.rowCount === 0) throw new AppError('Achievement type not found', 404);
  const achievementName = typeRes.rows[0].name;

  const res = await query(
    `INSERT INTO student_achievements
       (student_id, achievement_type_id, awarded_by, session_id, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [studentId, achievement_type_id, awardedBy, session_id, notes]
  );

  await createNotification(
    studentId,
    'system',
    `Achievement Awarded 🏅`,
    `You earned the "${achievementName}" medal!`,
    { achievement_id: res.rows[0].id }
  );

  return res.rows[0];
};

const revokeMedal = async (achievementId, adminId) => {
  const res = await query(
    'DELETE FROM student_achievements WHERE id = $1 RETURNING id',
    [achievementId]
  );
  if (res.rowCount === 0) throw new AppError('Achievement not found', 404);
};

module.exports = {
  getStudentCertificates,
  issueCertificate,
  revokeCertificate,
  getAchievementTypes,
  getStudentAchievements,
  awardMedal,
  revokeMedal,
};
