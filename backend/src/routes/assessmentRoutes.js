const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const { authenticate }     = require('../middleware/auth');
const { authorize }        = require('../middleware/role');
const { validate }         = require('../middleware/validate');
const { asyncHandler }     = require('../middleware/errorHandler');
const {
  assessmentIdValidator,
  studentIdValidator,
  listAssessmentsValidator,
  teacherReviewValidator,
} = require('../validators/assessmentValidators');

const router = express.Router();
router.use(authenticate);

// Student: list own assessments
router.get(
  '/',
  authorize('student'),
  listAssessmentsValidator,
  validate,
  asyncHandler(assessmentController.listMyAssessments)
);

// Teacher: list a specific student's assessments
// Must be registered BEFORE /:id to prevent 'student' being treated as a UUID
router.get(
  '/student/:studentId',
  authorize('teacher'),
  studentIdValidator,
  validate,
  asyncHandler(assessmentController.listStudentAssessments)
);

// Student / Teacher: get single assessment
router.get(
  '/:id',
  authorize('student', 'teacher'),
  assessmentIdValidator,
  validate,
  asyncHandler(assessmentController.getAssessmentById)
);

// Student: delete own assessment
router.delete(
  '/:id',
  authorize('student'),
  assessmentIdValidator,
  validate,
  asyncHandler(assessmentController.deleteAssessment)
);

// Teacher: submit optional review on a completed assessment
router.post(
  '/:id/review',
  authorize('teacher'),
  teacherReviewValidator,
  validate,
  asyncHandler(assessmentController.submitTeacherReview)
);

// Student: submit a recording for the memorization checker (Whisper + word alignment)
router.post(
  '/memorization',
  authorize('student'),
  asyncHandler(assessmentController.submitMemorizationCheck)
);

module.exports = router;
