import api from './axiosInstance';

export const certificateApi = {
  getCertificates:     (studentId)       => api.get(`/certificates/student/${studentId}`),
  issueCertificate:    (studentId, data) => api.post(`/certificates/student/${studentId}`, data),
  revokeCertificate:   (id)              => api.delete(`/certificates/${id}`),

  getAchievementTypes: ()                => api.get('/certificates/achievements/types'),
  getAchievements:     (studentId)       => api.get(`/certificates/achievements/student/${studentId}`),
  awardMedal:          (studentId, data) => api.post(`/certificates/achievements/student/${studentId}`, data),
  revokeMedal:         (id)              => api.delete(`/certificates/achievements/${id}`),
};
