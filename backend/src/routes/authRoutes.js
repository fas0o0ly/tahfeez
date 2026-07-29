// src/routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  resendVerificationValidator,
} = require('../validators/authValidators');

const router = express.Router();

// Strict rate limiting on sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many registration attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public routes ─────────────────────────────────────────────────────────
router.post('/register', registerLimiter, registerValidator, validate, asyncHandler(authController.register));
router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/login', authLimiter, loginValidator, validate, asyncHandler(authController.login));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, asyncHandler(authController.forgotPassword));
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, asyncHandler(authController.resetPassword));
router.post('/resend-verification', authLimiter, resendVerificationValidator, validate, asyncHandler(authController.resendVerification));

// ─── Protected routes ──────────────────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/change-password', authenticate, changePasswordValidator, validate, asyncHandler(authController.changePassword));
router.get('/me', authenticate, asyncHandler(authController.getMe));

module.exports = router;