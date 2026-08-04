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

// Per-route rate limiters — specific windows and caps per operation
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset requests. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many reset attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many resend attempts. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many refresh attempts. Try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public routes ─────────────────────────────────────────────────────────
router.post('/register', registerLimiter, registerValidator, validate, asyncHandler(authController.register));
router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/login', loginLimiter, loginValidator, validate, asyncHandler(authController.login));
router.post('/refresh-token', refreshTokenLimiter, asyncHandler(authController.refreshToken));
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, validate, asyncHandler(authController.forgotPassword));
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidator, validate, asyncHandler(authController.resetPassword));
router.post('/resend-verification', resendVerificationLimiter, resendVerificationValidator, validate, asyncHandler(authController.resendVerification));

// ─── Protected routes ──────────────────────────────────────────────────────
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/change-password', authenticate, changePasswordValidator, validate, asyncHandler(authController.changePassword));
router.get('/me', authenticate, asyncHandler(authController.getMe));

module.exports = router;