// src/validators/chatbotValidators.js
const { body, param, query } = require('express-validator');

const askValidator = [
  body('query')
    .trim()
    .notEmpty().withMessage('Query is required')
    .isLength({ min: 5 }).withMessage('Query must be at least 5 characters')
    .isLength({ max: 1000 }).withMessage('Query must be under 1000 characters'),
];

const deleteValidator = [
  param('id').isUUID().withMessage('Invalid conversation ID'),
];

const historyValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = { askValidator, deleteValidator, historyValidator };
