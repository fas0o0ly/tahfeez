const { param, body } = require('express-validator');

const studentIdValidator = [
  param('studentId').isUUID().withMessage('Invalid student ID'),
];

const noteIdValidator = [
  param('noteId').isUUID().withMessage('Invalid note ID'),
];

const updateProgressValidator = [
  param('studentId').isUUID().withMessage('Invalid student ID'),
  body('total_juz_memorized')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 30 })
    .withMessage('total_juz_memorized must be 0–30'),
  body('total_surahs_memorized')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 114 })
    .withMessage('total_surahs_memorized must be 0–114'),
  body('status')
    .optional({ nullable: true })
    .isIn(['not_started', 'in_progress', 'needs_revision', 'completed', 'certified'])
    .withMessage('Invalid status'),
  body('accuracy_grade')
    .optional({ nullable: true })
    .isIn(['excellent', 'very_good', 'good', 'acceptable', 'weak'])
    .withMessage('Invalid accuracy_grade'),
  body('teacher_notes')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 3000 }),
];

const addNoteValidator = [
  param('studentId').isUUID().withMessage('Invalid student ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Note content is required')
    .isLength({ max: 2000 }).withMessage('Note must be under 2000 characters'),
  body('is_private')
    .optional()
    .isBoolean(),
  body('session_id')
    .optional({ nullable: true })
    .isUUID().withMessage('Invalid session ID'),
];

module.exports = {
  studentIdValidator,
  noteIdValidator,
  updateProgressValidator,
  addNoteValidator,
};
