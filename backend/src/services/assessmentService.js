const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { deleteAudio } = require('./uploadService');

// ─── createAssessment ───────────────────────────────────────────────────────
const createAssessment = async (studentId, { surah_id, from_verse, to_verse }) => {
  const surahCheck = await query('SELECT id FROM surahs WHERE id = $1', [surah_id]);
  if (!surahCheck.rows[0]) throw new AppError('Surah not found', 404);

  const verseCount = await query(
    `SELECT COUNT(*) FROM verses
     WHERE surah_id = $1 AND verse_number BETWEEN $2 AND $3`,
    [surah_id, from_verse, to_verse]
  );
  const expected = to_verse - from_verse + 1;
  if (parseInt(verseCount.rows[0].count, 10) !== expected) {
    throw new AppError('One or more verses not found for this surah', 400);
  }

  const result = await query(
    `INSERT INTO recitation_assessments
       (student_id, surah_id, from_verse, to_verse, audio_url, status)
     VALUES ($1, $2, $3, $4, 'pending', 'pending')
     RETURNING *`,
    [studentId, surah_id, from_verse, to_verse]
  );
  return result.rows[0];
};

// ─── updateAssessmentWithResults ────────────────────────────────────────────
const updateAssessmentWithResults = async (assessmentId, data) => {
  const {
    audio_url, audio_duration_seconds, overall_score,
    tajweed_feedback, pronunciation_notes,
    fluency_grade, tajweed_grade, makharij_grade,
  } = data;

  const result = await query(
    `UPDATE recitation_assessments SET
       audio_url              = $2,
       audio_duration_seconds = $3,
       overall_score          = $4,
       tajweed_feedback       = $5,
       pronunciation_notes    = $6,
       fluency_grade          = $7,
       tajweed_grade          = $8,
       makharij_grade         = $9,
       status                 = 'completed',
       updated_at             = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      assessmentId, audio_url, audio_duration_seconds, overall_score,
      JSON.stringify(tajweed_feedback), pronunciation_notes,
      fluency_grade, tajweed_grade, makharij_grade,
    ]
  );
  return result.rows[0];
};

// ─── markAssessmentProcessing ───────────────────────────────────────────────
const markAssessmentProcessing = async (assessmentId) => {
  await query(
    `UPDATE recitation_assessments SET status = 'processing', updated_at = NOW()
     WHERE id = $1`,
    [assessmentId]
  );
};

// ─── markAssessmentFailed ───────────────────────────────────────────────────
const markAssessmentFailed = async (assessmentId) => {
  await query(
    `UPDATE recitation_assessments SET status = 'failed', updated_at = NOW()
     WHERE id = $1`,
    [assessmentId]
  );
};

// ─── listAssessments (student's own) ────────────────────────────────────────
const listAssessments = async ({ studentId, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT
         ra.id, ra.surah_id, ra.from_verse, ra.to_verse, ra.audio_url,
         ra.overall_score, ra.fluency_grade, ra.tajweed_grade, ra.makharij_grade,
         ra.pronunciation_notes, ra.status, ra.teacher_review,
         ra.audio_duration_seconds, ra.created_at,
         s.surah_number, s.name_arabic, s.name_english, s.name_transliteration
       FROM recitation_assessments ra
       JOIN surahs s ON s.id = ra.surah_id
       WHERE ra.student_id = $1
       ORDER BY ra.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    ),
    query(
      'SELECT COUNT(*) FROM recitation_assessments WHERE student_id = $1',
      [studentId]
    ),
  ]);

  const total       = parseInt(countRes.rows[0].count, 10);
  const total_pages = Math.ceil(total / limit);

  return {
    assessments: dataRes.rows,
    pagination: { total, page, limit, total_pages, has_next: page < total_pages, has_prev: page > 1 },
  };
};

// ─── listStudentAssessmentsForTeacher ───────────────────────────────────────
const listStudentAssessmentsForTeacher = async (studentId, teacherId) => {
  const authCheck = await query(
    `SELECT 1 FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $1 AND s.teacher_id = $2 AND se.status = 'approved'
     LIMIT 1`,
    [studentId, teacherId]
  );
  if (!authCheck.rows[0]) {
    throw new AppError('Not authorized to view this student\'s assessments', 403);
  }

  const result = await query(
    `SELECT
       ra.id, ra.from_verse, ra.to_verse, ra.audio_url,
       ra.overall_score, ra.fluency_grade, ra.tajweed_grade, ra.makharij_grade,
       ra.pronunciation_notes, ra.status, ra.teacher_review, ra.reviewed_at,
       ra.audio_duration_seconds, ra.created_at,
       s.surah_number, s.name_arabic, s.name_english, s.name_transliteration
     FROM recitation_assessments ra
     JOIN surahs s ON s.id = ra.surah_id
     WHERE ra.student_id = $1 AND ra.status = 'completed'
     ORDER BY ra.created_at DESC`,
    [studentId]
  );
  return result.rows;
};

// ─── getAssessmentById ───────────────────────────────────────────────────────
const getAssessmentById = async (assessmentId, requestingUser) => {
  const result = await query(
    `SELECT
       ra.*, s.surah_number, s.name_arabic, s.name_english, s.name_transliteration
     FROM recitation_assessments ra
     JOIN surahs s ON s.id = ra.surah_id
     WHERE ra.id = $1`,
    [assessmentId]
  );
  const assessment = result.rows[0];
  if (!assessment) throw new AppError('Assessment not found', 404);

  if (requestingUser.role === 'student') {
    if (assessment.student_id !== requestingUser.id) {
      throw new AppError('Not authorized', 403);
    }
  } else if (requestingUser.role === 'teacher') {
    const authCheck = await query(
      `SELECT 1 FROM session_enrollments se
       JOIN sessions s ON s.id = se.session_id
       WHERE se.student_id = $1 AND s.teacher_id = $2 AND se.status = 'approved'
       LIMIT 1`,
      [assessment.student_id, requestingUser.id]
    );
    if (!authCheck.rows[0]) throw new AppError('Not authorized', 403);
  }

  return assessment;
};

// ─── submitTeacherReview ─────────────────────────────────────────────────────
const submitTeacherReview = async (assessmentId, teacherId, reviewText) => {
  const check = await query(
    'SELECT student_id, status FROM recitation_assessments WHERE id = $1',
    [assessmentId]
  );
  const assessment = check.rows[0];
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (assessment.status !== 'completed') {
    throw new AppError('Can only review completed assessments', 400);
  }

  const authCheck = await query(
    `SELECT 1 FROM session_enrollments se
     JOIN sessions s ON s.id = se.session_id
     WHERE se.student_id = $1 AND s.teacher_id = $2 AND se.status = 'approved'
     LIMIT 1`,
    [assessment.student_id, teacherId]
  );
  if (!authCheck.rows[0]) throw new AppError('Not authorized to review this assessment', 403);

  const result = await query(
    `UPDATE recitation_assessments
     SET teacher_review = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [assessmentId, reviewText, teacherId]
  );
  return result.rows[0];
};

// ─── deleteAssessment ────────────────────────────────────────────────────────
const deleteAssessment = async (assessmentId, studentId) => {
  const check = await query(
    'SELECT id, status FROM recitation_assessments WHERE id = $1 AND student_id = $2',
    [assessmentId, studentId]
  );
  const assessment = check.rows[0];
  if (!assessment) throw new AppError('Assessment not found', 404);
  if (assessment.status === 'processing') {
    throw new AppError('Cannot delete an assessment while it is being processed', 400);
  }

  await deleteAudio(assessmentId);
  await query('DELETE FROM recitation_assessments WHERE id = $1', [assessmentId]);
};

module.exports = {
  createAssessment,
  updateAssessmentWithResults,
  markAssessmentProcessing,
  markAssessmentFailed,
  listAssessments,
  listStudentAssessmentsForTeacher,
  getAssessmentById,
  submitTeacherReview,
  deleteAssessment,
};
