const express = require('express');
const progressController = require('../controllers/progressController');
const { authenticate }   = require('../middleware/auth');
const { authorize }      = require('../middleware/role');
const { validate }       = require('../middleware/validate');
const { asyncHandler }   = require('../middleware/errorHandler');
const {
  studentIdValidator,
  noteIdValidator,
  updateProgressValidator,
  addNoteValidator,
} = require('../validators/progressValidators');

const router = express.Router();
router.use(authenticate);

// Student: own progress record (created on first read)
router.get('/my', authorize('student'), asyncHandler(progressController.getMyProgress));

// Teacher/admin: view a student's progress
router.get(
  '/student/:studentId',
  authorize('teacher', 'admin'),
  studentIdValidator,
  validate,
  asyncHandler(progressController.getStudentProgress)
);

// Teacher: update a student's progress
router.patch(
  '/student/:studentId',
  authorize('teacher'),
  updateProgressValidator,
  validate,
  asyncHandler(progressController.updateStudentProgress)
);

// Teacher + student: view notes (student sees only non-private)
router.get(
  '/student/:studentId/notes',
  authorize('teacher', 'student'),
  studentIdValidator,
  validate,
  asyncHandler(progressController.getStudentNotes)
);

// Teacher: add a note
router.post(
  '/student/:studentId/notes',
  authorize('teacher'),
  addNoteValidator,
  validate,
  asyncHandler(progressController.addNote)
);

// Teacher: delete own note
router.delete(
  '/notes/:noteId',
  authorize('teacher'),
  noteIdValidator,
  validate,
  asyncHandler(progressController.deleteNote)
);

module.exports = router;
