// src/routes/chatbotRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { askValidator, deleteValidator, historyValidator } = require('../validators/chatbotValidators');

const router = express.Router();

router.use(authenticate);

// Per-user limit to prevent runaway OpenAI cost
const chatbotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Chatbot rate limit exceeded. Try again in an hour.' },
});

router.post('/', chatbotLimiter, askValidator, validate, asyncHandler(ctrl.askChatbot));
router.get('/history', historyValidator, validate, asyncHandler(ctrl.getHistory));
router.delete('/:id', deleteValidator, validate, asyncHandler(ctrl.deleteConversation));

module.exports = router;
