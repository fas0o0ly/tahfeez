const assessmentService = require('../services/assessmentService');
const memorizationService = require('../services/memorizationService');
const { handleAudioUpload } = require('../middleware/upload');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const listMyAssessments = async (req, res) => {
  const result = await assessmentService.listAssessments({
    studentId: req.user.id,
    page:  parseInt(req.query.page,  10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
  });
  return success(res, result, 'Assessments retrieved successfully');
};

const getAssessmentById = async (req, res) => {
  const assessment = await assessmentService.getAssessmentById(req.params.id, req.user);
  return success(res, { assessment }, 'Assessment retrieved successfully');
};

const deleteAssessment = async (req, res) => {
  await assessmentService.deleteAssessment(req.params.id, req.user.id);
  return success(res, null, 'Assessment deleted');
};

const listStudentAssessments = async (req, res) => {
  const assessments = await assessmentService.listStudentAssessmentsForTeacher(
    req.params.studentId,
    req.user.id
  );
  return success(res, { assessments }, 'Assessments retrieved successfully');
};

const submitTeacherReview = async (req, res) => {
  const assessment = await assessmentService.submitTeacherReview(
    req.params.id,
    req.user.id,
    req.body.review_text
  );
  return success(res, { assessment }, 'Review submitted successfully');
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const submitMemorizationCheck = async (req, res) => {
  // express-validator can't see multipart fields until multer parses them,
  // so this route validates manually after handleAudioUpload runs.
  await handleAudioUpload(req, res);
  if (!req.file) throw new AppError('Audio file is required', 400);

  const { surah_id } = req.body;
  const from_verse = parseInt(req.body.from_verse, 10);
  const to_verse = parseInt(req.body.to_verse, 10);

  if (!UUID_RE.test(surah_id || '')) throw new AppError('Invalid surah_id', 400);
  if (!Number.isInteger(from_verse) || !Number.isInteger(to_verse) || from_verse < 1 || to_verse < from_verse) {
    throw new AppError('Invalid verse range', 400);
  }

  const assessment = await memorizationService.submitMemorizationCheck(
    req.user.id,
    { surah_id, from_verse, to_verse },
    req.file
  );
  return success(res, { assessment }, 'Recitation submitted for processing', 202);
};

module.exports = {
  listMyAssessments,
  getAssessmentById,
  deleteAssessment,
  listStudentAssessments,
  submitTeacherReview,
  submitMemorizationCheck,
};
