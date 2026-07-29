import api from './axiosInstance';

export const reportingApi = {
  getOrgStats:      (period = 'all') => api.get('/reports/organization', { params: { period } }),
  getStudentReport: (studentId, period = 'all') => api.get(`/reports/student/${studentId}`, { params: { period } }),
  getSessionReport: (sessionId, period = 'all') => api.get(`/reports/session/${sessionId}`, { params: { period } }),
  getTeacherReport: (teacherId, period = 'all') => api.get(`/reports/teacher/${teacherId}`, { params: { period } }),
};
