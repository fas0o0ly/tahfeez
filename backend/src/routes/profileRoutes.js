// src/routes/profileRoutes.js
const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { updateProfileValidator } = require('../validators/profileValidators');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// ─── Own profile ───────────────────────────────────────────────────────────
router.get('/',    asyncHandler(profileController.getProfile));
router.patch('/',  updateProfileValidator, validate, asyncHandler(profileController.updateProfile));

// ─── Avatar ────────────────────────────────────────────────────────────────
router.patch('/avatar',  asyncHandler(profileController.uploadAvatar));
router.delete('/avatar', asyncHandler(profileController.removeAvatar));

module.exports = router;