// src/api/sessionApi.js
import api from './axiosInstance';

export const sessionApi = {
  // ─── Sessions ─────────────────────────────────────────────────────────────
  listSessions:   (params) => api.get('/sessions', { params }),
  getMyTeacherSessions: () => api.get('/sessions/my'),
  getSessionById: (id)     => api.get(`/sessions/${id}`),
  createSession:  (data)   => api.post('/sessions', data),
  updateSession:  (id, data) => api.patch(`/sessions/${id}`, data),
  updateStatus:   (id, status) => api.patch(`/sessions/${id}/status`, { status }),
  assignTeacher:  (id, teacher_id) => api.post(`/sessions/${id}/assign`, { teacher_id }),
  approveTeacher: (id)     => api.patch(`/sessions/${id}/approve-teacher`),
  requestToTeach: (id)     => api.post(`/sessions/${id}/request-teach`),

  // ─── Students / teacher profiles ──────────────────────────────────────────
  getSessionStudents:      (id) => api.get(`/sessions/${id}/students`),
  getSessionTeacherProfile:(id) => api.get(`/sessions/${id}/teacher-profile`),

  // ─── Enrollments ──────────────────────────────────────────────────────────
  enroll:           (id)  => api.post(`/sessions/${id}/enroll`),
  withdraw:         (id)  => api.delete(`/sessions/${id}/enroll`),
  getEnrollments:   (id)  => api.get(`/sessions/${id}/enrollments`),
  updateEnrollment: (id, enrollmentId, status) =>
    api.patch(`/sessions/${id}/enrollments/${enrollmentId}`, { status }),
};