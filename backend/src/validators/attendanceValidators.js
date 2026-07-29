const { param, query, body } = require('express-validator');

const sessionIdValidator = [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
];

const studentIdValidator = [
  param('studentId').isUUID().withMessage('Invalid student ID'),
];

const dateQueryValidator = [
  query('date')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('date must be in YYYY-MM-DD format'),
];

const upsertAttendanceValidator = [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
  param('studentId').isUUID().withMessage('Invalid student ID'),
  body('present').isBoolean().withMessage('present must be a boolean'),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 1000 }),
  body('date')
    .optional({ nullable: true })
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('date must be in YYYY-MM-DD format'),
];

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const noteIdValidator = [
  param('noteId').isUUID().withMessage('Invalid note ID'),
];

module.exports = {
  sessionIdValidator,
  studentIdValidator,
  dateQueryValidator,
  upsertAttendanceValidator,
  paginationValidator,
  noteIdValidator,
};
