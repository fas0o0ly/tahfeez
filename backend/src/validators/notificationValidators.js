const { param, query } = require('express-validator');

const notificationIdValidator = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

const notificationListValidator = [
  query('unread')
    .optional()
    .isIn(['true', 'false']).withMessage('unread must be true or false'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = {
  notificationIdValidator,
  notificationListValidator,
};
