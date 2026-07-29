// src/validators/enrollmentValidators.js
const { param, body } = require('express-validator');

const enrollmentActionValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),
  param('enrollmentId').isUUID().withMessage('Invalid enrollment ID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
];

const sessionIdValidator = [
  param('id').isUUID().withMessage('Invalid session ID'),
];

module.exports = { enrollmentActionValidator, sessionIdValidator };