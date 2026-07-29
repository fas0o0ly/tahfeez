// src/routes/sessionRoutes.js
const express = require('express');
const sessionController  = require('../controllers/sessionController');
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/role');
const { validate }     = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  createSessionValidator,
  updateSessionValidator,
  sessionIdValidator,
  listSessionsValidator,
  assignTeacherValidator,
  updateSessionStatusValidator,
} = require('../validators/sessionValidators');
const {
  enrollmentActionValidator,
  sessionIdValidator: enrollmentSessionIdValidator,
} = require('../validators/enrollmentValidators');

const router = express.Router();

// All session routes require authentication
router.use(authenticate);

// ─── Session listing — all authenticated roles ─────────────────────────────
router.get(
  '/',
  listSessionsValidator,
  validate,
  asyncHandler(sessionController.listSessions)
);

// ─── Teacher's own sessions ────────────────────────────────────────────────
router.get(
  '/my',
  authorize('teacher'),
  asyncHandler(sessionController.getMyTeacherSessions)
);

// ─── Single session detail — all roles ────────────────────────────────────
router.get(
  '/:id',
  sessionIdValidator,
  validate,
  asyncHandler(sessionController.getSessionById)
);

// ─── Admin — create & manage sessions ─────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  createSessionValidator,
  validate,
  asyncHandler(sessionController.createSession)
);

router.patch(
  '/:id',
  authorize('admin'),
  updateSessionValidator,
  validate,
  asyncHandler(sessionController.updateSession)
);

router.post(
  '/:id/assign',
  authorize('admin'),
  assignTeacherValidator,
  validate,
  asyncHandler(sessionController.assignTeacher)
);

router.patch(
  '/:id/approve-teacher',
  authorize('admin'),
  sessionIdValidator,
  validate,
  asyncHandler(sessionController.approveTeacherRequest)
);

// ─── Status transitions — admin can cancel/complete, teacher can start ─────
router.patch(
  '/:id/status',
  authorize('admin', 'teacher'),
  updateSessionStatusValidator,
  validate,
  asyncHandler(sessionController.updateSessionStatus)
);

// ─── Teacher — request to teach an unassigned session ─────────────────────
router.post(
  '/:id/request-teach',
  authorize('teacher'),
  sessionIdValidator,
  validate,
  asyncHandler(sessionController.requestToTeach)
);

// ─── Teacher — view enrolled students with profiles ────────────────────────
router.get(
  '/:id/students',
  authorize('teacher'),
  sessionIdValidator,
  validate,
  asyncHandler(sessionController.getSessionStudents)
);

// ─── View teacher profile — admin always, student only if enrolled ────────
router.get(
  '/:id/teacher-profile',
  authorize('admin', 'student'),
  sessionIdValidator,
  validate,
  asyncHandler(sessionController.getSessionTeacherProfile)
);

// ─── Enrollments — all roles interact here ────────────────────────────────

// Student enrolls
router.post(
  '/:id/enroll',
  authorize('student'),
  enrollmentSessionIdValidator,
  validate,
  asyncHandler(enrollmentController.requestEnrollment)
);

// Student withdraws
router.delete(
  '/:id/enroll',
  authorize('student'),
  enrollmentSessionIdValidator,
  validate,
  asyncHandler(enrollmentController.withdrawEnrollment)
);

// Admin or teacher views all enrollments
router.get(
  '/:id/enrollments',
  authorize('admin', 'teacher'),
  enrollmentSessionIdValidator,
  validate,
  asyncHandler(enrollmentController.getSessionEnrollments)
);

// Teacher approves or rejects a specific enrollment
router.patch(
  '/:id/enrollments/:enrollmentId',
  authorize('teacher'),
  enrollmentActionValidator,
  validate,
  asyncHandler(enrollmentController.updateEnrollmentStatus)
);

module.exports = router;