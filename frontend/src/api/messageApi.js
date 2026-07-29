import api from './axiosInstance';

export const messageApi = {
  getInbox:          (params = {}) => api.get('/messages', { params }),
  getConversation:   (userId)      => api.get(`/messages/conversation/${userId}`),
  sendMessage:       (data)        => api.post('/messages', data),
  deleteMessage:     (messageId)   => api.delete(`/messages/${messageId}`),
  getContacts:       ()            => api.get('/messages/contacts'),
};
