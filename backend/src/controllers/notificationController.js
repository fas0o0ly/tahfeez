const svc = require('../services/messagingService');
const { success } = require('../utils/response');

const getNotifications = async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const page  = parseInt(req.query.page  || '1',  10);
  const limit = parseInt(req.query.limit || '20', 10);
  const result = await svc.getNotifications(req.user.id, { unreadOnly, page, limit });
  return success(res, result, 'Notifications retrieved');
};

const getUnreadCount = async (req, res) => {
  const count = await svc.getUnreadCount(req.user.id);
  return success(res, { count }, 'Unread count retrieved');
};

const getRecentNotifications = async (req, res) => {
  const notifications = await svc.getRecentNotifications(req.user.id, 8);
  return success(res, { notifications }, 'Recent notifications retrieved');
};

const markRead = async (req, res) => {
  await svc.markNotificationRead(req.params.id, req.user.id);
  return success(res, null, 'Notification marked as read');
};

const markAllRead = async (req, res) => {
  await svc.markAllNotificationsRead(req.user.id);
  return success(res, null, 'All notifications marked as read');
};

const deleteNotification = async (req, res) => {
  await svc.deleteNotification(req.params.id, req.user.id);
  return success(res, null, 'Notification deleted');
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getRecentNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
