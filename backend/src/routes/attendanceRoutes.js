const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate }     = require('../middleware/auth');
const { authorize }        = require('../middleware/role');
const { validate }         = require('../middleware/validate');
const { asyncHandler }     = require('../middleware/errorHandler');
const {
  sessionIdValidator,
  studentIdValidator,
  dateQueryValidator,
  upsertAttendanceValidator,
  paginationValidator,
} = require('../validators/attendanceValidators');

const router = express.Router();
router.use(authenticate);

// Teacher/admin: get all students + attendance for a session on a given date
router.get(
  '/session/:sessionId',
  authorize('teacher', 'admin'),
  [...sessionIdValidator, ...dateQueryValidator],
  validate,
  asyncHandler(attendanceController.getSessionAttendance)
);

// Teacher/admin: get all occurrence dates for a session
router.get(
  '/session/:sessionId/dates',
  authorize('teacher', 'admin'),
  sessionIdValidator,
  validate,
  asyncHandler(attendanceController.getSessionOccurrenceDates)
);

// Teacher: upsert attendance for one student on a given date
router.patch(
  '/session/:sessionId/student/:studentId',
  authorize('teacher'),
  upsertAttendanceValidator,
  validate,
  asyncHandler(attendanceController.upsertStudentAttendance)
);

// Student: own attendance history + rate
router.get(
  '/my',
  authorize('student'),
  paginationValidator,
  validate,
  asyncHandler(attendanceController.getMyAttendance)
);

// Teacher/admin: specific student's attendance history
router.get(
  '/student/:studentId',
  authorize('teacher', 'admin'),
  [...studentIdValidator, ...paginationValidator],
  validate,
  asyncHandler(attendanceController.getStudentAttendance)
);

module.exports = router;
