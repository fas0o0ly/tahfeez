const express = require('express');
const ctrl           = require('../controllers/notificationController');
const { authenticate }  = require('../middleware/auth');
const { authorize }     = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const { asyncHandler }  = require('../middleware/errorHandler');
const {
  notificationIdValidator,
  notificationListValidator,
} = require('../validators/notificationValidators');

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'teacher', 'student'));

// Unread count — must be before /:id routes to avoid param conflict
router.get('/unread-count', asyncHandler(ctrl.getUnreadCount));

// Recent notifications for bell dropdown
router.get('/recent', asyncHandler(ctrl.getRecentNotifications));

// Paginated notification list
router.get(
  '/',
  notificationListValidator,
  validate,
  asyncHandler(ctrl.getNotifications)
);

// Mark one as read
router.patch(
  '/:id/read',
  notificationIdValidator,
  validate,
  asyncHandler(ctrl.markRead)
);

// Mark all as read
router.patch('/read-all', asyncHandler(ctrl.markAllRead));

// Delete one notification
router.delete(
  '/:id',
  notificationIdValidator,
  validate,
  asyncHandler(ctrl.deleteNotification)
);

module.exports = router;
