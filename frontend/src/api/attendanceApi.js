import api from './axiosInstance';

export const attendanceApi = {
  // Attendance
  getSessionAttendance:   (sessionId, date)              => api.get(`/attendance/session/${sessionId}`, { params: date ? { date } : {} }),
  getSessionDates:        (sessionId)                    => api.get(`/attendance/session/${sessionId}/dates`),
  upsertAttendance:       (sessionId, studentId, data)   => api.patch(`/attendance/session/${sessionId}/student/${studentId}`, data),
  getMyAttendance:        (params)                       => api.get('/attendance/my', { params }),
  getStudentAttendance:   (studentId, params)            => api.get(`/attendance/student/${studentId}`, { params }),

  // Progress
  getMyProgress:          ()                             => api.get('/progress/my'),
  getStudentProgress:     (studentId)                    => api.get(`/progress/student/${studentId}`),
  updateStudentProgress:  (studentId, data)              => api.patch(`/progress/student/${studentId}`, data),

  // Notes
  getStudentNotes:        (studentId)                    => api.get(`/progress/student/${studentId}/notes`),
  addNote:                (studentId, data)              => api.post(`/progress/student/${studentId}/notes`, data),
  deleteNote:             (noteId)                       => api.delete(`/progress/notes/${noteId}`),
};
