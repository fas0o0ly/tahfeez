// src/validators/userValidators.js
const { query: queryValidator, param, body } = require('express-validator');

const listUsersValidator = [
  queryValidator('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Role must be admin, teacher, or student'),

  queryValidator('status')
    .optional()
    .isIn(['pending', 'active', 'suspended', 'banned'])
    .withMessage('Invalid status value'),

  queryValidator('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),

  queryValidator('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  queryValidator('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

const userIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID'),
];

const updateStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'suspended', 'banned', 'pending'])
    .withMessage('Status must be active, suspended, banned, or pending'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be under 500 characters'),
];

module.exports = { listUsersValidator, userIdValidator, updateStatusValidator };