import api from './axiosInstance';

export const assessmentApi = {
  listMyAssessments:      (params)      => api.get('/assessments', { params }),
  getAssessmentById:      (id)          => api.get(`/assessments/${id}`),
  deleteAssessment:       (id)          => api.delete(`/assessments/${id}`),
  listStudentAssessments: (studentId)   => api.get(`/assessments/student/${studentId}`),
  submitReview:           (id, review_text) => api.post(`/assessments/${id}/review`, { review_text }),
  // The instance default Content-Type is application/json — clear it here so
  // the browser sets multipart/form-data with the correct boundary itself.
  submitMemorizationCheck: (formData) => api.post('/assessments/memorization', formData, {
    headers: { 'Content-Type': undefined },
  }),
};
