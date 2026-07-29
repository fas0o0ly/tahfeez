import api from './axiosInstance';

export const notificationApi = {
  getAll:         (params = {}) => api.get('/notifications', { params }),
  getRecent:      ()            => api.get('/notifications/recent'),
  getUnreadCount: ()            => api.get('/notifications/unread-count'),
  markRead:       (id)          => api.patch(`/notifications/${id}/read`),
  markAllRead:    ()            => api.patch('/notifications/read-all'),
  delete:         (id)          => api.delete(`/notifications/${id}`),
};
