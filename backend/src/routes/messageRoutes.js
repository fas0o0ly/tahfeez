const express = require('express');
const ctrl           = require('../controllers/messageController');
const { authenticate }  = require('../middleware/auth');
const { authorize }     = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const { asyncHandler }  = require('../middleware/errorHandler');
const {
  sendMessageValidator,
  conversationUserIdValidator,
  messageIdValidator,
} = require('../validators/messageValidators');

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'teacher', 'student'));

// List all contacts the user can message
router.get('/contacts', asyncHandler(ctrl.getContacts));

// Inbox (conversation list)
router.get('/', asyncHandler(ctrl.getInbox));

// Conversation thread with a specific user
router.get(
  '/conversation/:userId',
  conversationUserIdValidator,
  validate,
  asyncHandler(ctrl.getConversation)
);

// Send a new message
router.post(
  '/',
  sendMessageValidator,
  validate,
  asyncHandler(ctrl.sendMessage)
);

// Soft-delete a message
router.delete(
  '/:messageId',
  messageIdValidator,
  validate,
  asyncHandler(ctrl.deleteMessage)
);

module.exports = router;
