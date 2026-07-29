// src/api/authApi.js
import api from './axiosInstance';

export const authApi = {
  register: (data) => api.post('/auth/register', data),

  login: (data) => api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refreshToken: () => api.post('/auth/refresh-token'),

  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: (data) => api.post('/auth/reset-password', data),

  changePassword: (data) => api.post('/auth/change-password', data),

  getMe: () => api.get('/auth/me'),

  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};