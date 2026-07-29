const { param, query, body } = require('express-validator');

const assessmentIdValidator = [
  param('id').isUUID().withMessage('Invalid assessment ID'),
];

const studentIdValidator = [
  param('studentId').isUUID().withMessage('Invalid student ID'),
];

const listAssessmentsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50'),
];

const teacherReviewValidator = [
  param('id').isUUID().withMessage('Invalid assessment ID'),
  body('review_text')
    .trim()
    .notEmpty().withMessage('Review text is required')
    .isLength({ max: 2000 }).withMessage('Review must be under 2000 characters'),
];

module.exports = {
  assessmentIdValidator,
  studentIdValidator,
  listAssessmentsValidator,
  teacherReviewValidator,
};
