// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  listUsersValidator,
  userIdValidator,
  updateStatusValidator,
} = require('../validators/userValidators');

const router = express.Router();

// All user management routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ─── Stats & overview ──────────────────────────────────────────────────────
router.get('/stats',   asyncHandler(userController.getUserStats));
router.get('/pending', asyncHandler(userController.getPendingTeachers));

// ─── User list & detail ────────────────────────────────────────────────────
router.get('/',    listUsersValidator, validate, asyncHandler(userController.listUsers));
router.get('/:id', userIdValidator,    validate, asyncHandler(userController.getUserById));

// ─── User actions ──────────────────────────────────────────────────────────
router.patch(
  '/:id/status',
  updateStatusValidator,
  validate,
  asyncHandler(userController.updateUserStatus)
);

router.patch(
  '/:id/ijazah',
  userIdValidator,
  validate,
  asyncHandler(userController.verifyTeacherIjazah)
);

router.delete(
  '/:id',
  userIdValidator,
  validate,
  asyncHandler(userController.deleteUser)
);

module.exports = router;