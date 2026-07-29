// src/validators/sessionValidators.js
const { body, param, query } = require('express-validator');

const createSessionValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Session title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),

  body('session_type')
    .notEmpty().withMessage('Session type is required')
    .isIn(['one_on_one', 'group', 'open']).withMessage('Invalid session type'),

  body('scheduled_at')
    .notEmpty().withMessage('Scheduled date/time is required')
    .isISO8601().withMessage('Invalid date format — use ISO 8601')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Session must be scheduled in the future');
      }
      return true;
    }),

  body('session_days')
    .isArray({ min: 1 }).withMessage('At least one session day is required'),

  body('session_days.*')
    .isIn(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])
    .withMessage('Invalid day value'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),

  body('max_students')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Max students must be between 1 and 100'),

  body('session_gender')
    .notEmpty().withMessage('Session gender is required')
    .isIn(['male', 'female']).withMessage('Gender must be male or female'),

  body('session_language')
    .notEmpty().withMessage('Session language is required')
    .isIn(['arabic', 'english', 'malay', 'urdu', 'french', 'other'])
    .withMessage('Invalid language'),

  body('age_range_min')
    .optional({ nullable: true })
    .isInt({ min: 4, max: 99 }).withMessage('Minimum age must be between 4 and 99'),

  body('age_range_max')
    .optional({ nullable: true })
    .isInt({ min: 5, max: 100 }).withMessage('Maximum age must be between 5 and 100')
    .custom((value, { req }) => {
      if (req.body.age_range_min && value <= req.body.age_range_min) {
        throw new Error('Maximum age must be greater than minimum age');
      }
      return true;
    }),

  body('teacher_id')
    .optional({ nullable: true })
    .isUUID().withMessage('Invalid teacher ID'),

  body('agora_channel')
    .trim()
    .notEmpty().withMessage('Agora channel name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Agora channel name must be 3–100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Agora channel name may only contain letters, numbers, hyphens, and underscores'),
];

const updateSessionValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description too long'),

  body('scheduled_at')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Session must be scheduled in the future');
      }
      return true;
    }),

  body('session_days')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one session day required'),

  body('session_days.*')
    .optional()
    .isIn(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])
    .withMessage('Invalid day value'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('Duration must be 15–480 minutes'),

  body('max_students')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Max students must be 1–100'),

  body('session_gender')
    .optional()
    .isIn(['male', 'female']).withMessage('Invalid gender'),

  body('session_language')
    .optional()
    .isIn(['arabic', 'english', 'malay', 'urdu', 'french', 'other'])
    .withMessage('Invalid language'),

  body('age_range_min')
    .optional({ nullable: true })
    .isInt({ min: 4, max: 99 }).withMessage('Min age must be 4–99'),

  body('age_range_max')
    .optional({ nullable: true })
    .isInt({ min: 5, max: 100 }).withMessage('Max age must be 5–100'),

  body('agora_channel')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Agora channel name must be 3–100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Agora channel name may only contain letters, numbers, hyphens, and underscores'),
];

const sessionIdValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),
];

const listSessionsValidator = [
  query('type')
    .optional()
    .isIn(['one_on_one', 'group', 'open']).withMessage('Invalid session type'),

  query('status')
    .optional()
    .isIn(['draft', 'scheduled', 'live', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  query('gender')
    .optional()
    .isIn(['male', 'female']).withMessage('Invalid gender'),

  query('language')
    .optional()
    .isIn(['arabic', 'english', 'malay', 'urdu', 'french', 'other'])
    .withMessage('Invalid language'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50').toInt(),
];

const assignTeacherValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),
  body('teacher_id').isUUID().withMessage('Invalid teacher ID'),
];

const updateSessionStatusValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['scheduled', 'live', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

module.exports = {
  createSessionValidator,
  updateSessionValidator,
  sessionIdValidator,
  listSessionsValidator,
  assignTeacherValidator,
  updateSessionStatusValidator,
};