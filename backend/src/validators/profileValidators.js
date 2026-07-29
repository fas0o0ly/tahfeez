// src/validators/profileValidators.js
const { body } = require('express-validator');

// Shared fields any role can update
const sharedProfileFields = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be 2–150 characters'),

  body('phone')
  .optional({ nullable: true })
  .trim()
  .isLength({ max: 30 })
  .withMessage('Phone number too long'),

  body('nationality')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nationality too long'),

  body('preferred_language')
    .optional()
    .isIn(['arabic', 'english', 'malay', 'urdu', 'french', 'other'])
    .withMessage('Invalid language selection'),

  body('date_of_birth')
  .optional({ nullable: true })
  .custom((value) => {
    if (value === null || value === '') return true;
    // Accept both YYYY-MM-DD and ISO timestamp from DB
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid date of birth');
    return true;
  })
  .withMessage('Invalid date of birth format'),
];

// Student-specific fields
const studentProfileFields = [
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 3, max: 120 })
    .withMessage('Age must be between 3 and 120'),

  body('guardian_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Guardian name too long'),

  body('guardian_phone')
  .optional({ nullable: true })
  .trim()
  .isLength({ max: 30 })
  .withMessage('Guardian phone number too long'),

  body('current_level')
    .optional({ nullable: true })
    .trim()
    .isIn(['beginner', 'intermediate', 'advanced', ''])
    .withMessage('Level must be beginner, intermediate, or advanced'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes too long'),
];

// Teacher-specific fields
const teacherProfileFields = [
  body('bio')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio must be under 2000 characters'),

  body('qualifications')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Qualifications too long'),

  body('years_experience')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 70 })
    .withMessage('Years experience must be between 0 and 70'),

  body('specializations')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Specializations must be an array'),

  body('specializations.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each specialization must be under 50 characters'),

  body('ijazah_chain')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Ijazah chain too long'),

  body('available_days')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Available days must be an array'),

  body('available_days.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day value'),

  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Invalid timezone'),

  body('max_students')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Max students must be between 1 and 100'),

  body('cv_url')
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage('CV must be a valid URL'),
];

// Admin-specific fields
const adminProfileFields = [
  body('department')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name too long'),
];

const updateProfileValidator = [
  ...sharedProfileFields,
  ...studentProfileFields,
  ...teacherProfileFields,
  ...adminProfileFields,
];

module.exports = { updateProfileValidator };