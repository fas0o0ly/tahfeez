import api from './axiosInstance';

export const requestAgoraToken = (sessionId) =>
  api.post(`/sessions/${sessionId}/token`);

export const leaveSession = (sessionId, durationSeconds) =>
  api.post(`/sessions/${sessionId}/leave`, { duration_seconds: durationSeconds });

export const endSession = (sessionId) =>
  api.put(`/sessions/${sessionId}/end`);

export const fetchParticipants = (sessionId) =>
  api.get(`/sessions/${sessionId}/participants`);

export const sendSignal = (sessionId, type, payload = null) =>
  api.post(`/sessions/${sessionId}/signal`, { type, payload });

export const fetchSignals = (sessionId, since) =>
  api.get(`/sessions/${sessionId}/signals`, { params: { since } });

export const clearHandRaise = (sessionId, userId) =>
  api.delete(`/sessions/${sessionId}/signal/hand`, { data: { user_id: userId } });