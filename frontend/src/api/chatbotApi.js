import api from './axiosInstance';

export const chatbotApi = {
  sendQuery:           (query) => api.post('/chatbot', { query }),
  getHistory:          (limit = 20) => api.get('/chatbot/history', { params: { limit } }),
  deleteConversation:  (id) => api.delete(`/chatbot/${id}`),
};
