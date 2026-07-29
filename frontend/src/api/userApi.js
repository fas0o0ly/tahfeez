// src/api/userApi.js
import api from './axiosInstance';

export const userApi = {
  // ─── Admin — user management ────────────────────────────────────────────
  listUsers: (params) => api.get('/users', { params }),
  getUserStats: () => api.get('/users/stats'),
  getPendingTeachers: () => api.get('/users/pending'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, status, reason) =>
    api.patch(`/users/${id}/status`, { status, reason }),
  verifyIjazah: (id) => api.patch(`/users/${id}/ijazah`),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // ─── Profile — own account ───────────────────────────────────────────────
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.patch('/profile', data),
  uploadAvatar: (formData) =>
    api.patch('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeAvatar: () => api.delete('/profile/avatar'),
};