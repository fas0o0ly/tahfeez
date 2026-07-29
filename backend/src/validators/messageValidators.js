const { body, param, query } = require('express-validator');

const sendMessageValidator = [
  body('recipient_id')
    .isUUID().withMessage('recipient_id must be a valid UUID'),
  body('content')
    .isString().trim().notEmpty().withMessage('content is required')
    .isLength({ max: 5000 }).withMessage('content must be under 5000 characters'),
  body('subject')
    .optional({ nullable: true })
    .isString().trim()
    .isLength({ max: 255 }).withMessage('subject must be under 255 characters'),
  body('parent_message_id')
    .optional({ nullable: true })
    .isUUID().withMessage('parent_message_id must be a valid UUID'),
];

const conversationUserIdValidator = [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
];

const messageIdValidator = [
  param('messageId').isUUID().withMessage('messageId must be a valid UUID'),
];

module.exports = {
  sendMessageValidator,
  conversationUserIdValidator,
  messageIdValidator,
};
