// src/routes/chatbotRoutes.js
const express = require('express');
const ctrl = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { askValidator, deleteValidator, historyValidator } = require('../validators/chatbotValidators');

const router = express.Router();

router.use(authenticate);

router.post('/', askValidator, validate, asyncHandler(ctrl.askChatbot));
router.get('/history', historyValidator, validate, asyncHandler(ctrl.getHistory));
router.delete('/:id', deleteValidator, validate, asyncHandler(ctrl.deleteConversation));

module.exports = router;
