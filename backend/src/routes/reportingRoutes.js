const express = require('express');
const ctrl          = require('../controllers/reportingController');
const { authenticate }  = require('../middleware/auth');
const { authorize }     = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const { asyncHandler }  = require('../middleware/errorHandler');
const {
  periodValidator,
  studentIdParam,
  sessionIdParam,
  teacherIdParam,
} = require('../validators/reportingValidators');

const router = express.Router();

// Public — no auth required
router.get('/public/stats', asyncHandler(ctrl.getPublicStats));

router.use(authenticate);

// Org-wide stats — admin only
router.get(
  '/organization',
  authorize('admin'),
  periodValidator, validate,
  asyncHandler(ctrl.getOrgStats)
);

// Student report — teacher, admin, or student viewing own
router.get(
  '/student/:studentId',
  authorize('teacher', 'admin', 'student'),
  [...studentIdParam, ...periodValidator], validate,
  asyncHandler(ctrl.getStudentReport)
);

// Session report — teacher or admin
router.get(
  '/session/:sessionId',
  authorize('teacher', 'admin'),
  [...sessionIdParam, ...periodValidator], validate,
  asyncHandler(ctrl.getSessionReport)
);

// Teacher report — teacher viewing own or admin
router.get(
  '/teacher/:teacherId',
  authorize('teacher', 'admin'),
  [...teacherIdParam, ...periodValidator], validate,
  asyncHandler(ctrl.getTeacherReport)
);

module.exports = router;
