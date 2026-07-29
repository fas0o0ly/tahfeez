// src/config/aiService.js
// Client for the internal Python memorization-checker microservice.
// AI_SERVICE_URL must point to a host only reachable by this backend —
// never expose it to the frontend.
const { AppError } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

const assessMemorization = async (audioBuffer, filename, mimetype, { surah_id, from_verse, to_verse }) => {
  const form = new FormData();
  form.append('audio', new Blob([audioBuffer], { type: mimetype }), filename);
  form.append('surah_id', surah_id);
  form.append('from_verse', String(from_verse));
  form.append('to_verse', String(to_verse));

  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}/assess`, { method: 'POST', body: form });
  } catch {
    throw new AppError('AI assessment service is unavailable', 503);
  }

  if (!response.ok) {
    throw new AppError('AI assessment service failed to process the recitation', 502);
  }

  return response.json();
};

module.exports = { assessMemorization };
