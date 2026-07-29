// src/services/memorizationService.js
// Orchestrates the memorization-checker flow: create pending assessment row,
// store audio, call the Python AI service, persist per-word results.
//
// Scope: memorization verification only (right words, right order) — not
// Tajweed/Makharij grading, which stays on the existing Qurani.ai pipeline.
const assessmentService = require('./assessmentService');
const { uploadAudio } = require('./uploadService');
const { assessMemorization } = require('../config/aiService');

// Runs after the request has already responded — failures are persisted on
// the row itself (status='failed') rather than thrown to a dead response.
const processInBackground = async (assessmentId, { surah_id, from_verse, to_verse }, file) => {
  try {
    const audioUrl = await uploadAudio(file.buffer, assessmentId);
    const result = await assessMemorization(file.buffer, file.originalname, file.mimetype, {
      surah_id, from_verse, to_verse,
    });

    await assessmentService.updateAssessmentWithResults(assessmentId, {
      audio_url: audioUrl,
      audio_duration_seconds: null,
      overall_score: result.overall_score,
      tajweed_feedback: result.words,
      pronunciation_notes: null,
      fluency_grade: null,
      tajweed_grade: null,
      makharij_grade: null,
    });
  } catch {
    await assessmentService.markAssessmentFailed(assessmentId);
  }
};

const submitMemorizationCheck = async (studentId, { surah_id, from_verse, to_verse }, file) => {
  const assessment = await assessmentService.createAssessment(studentId, { surah_id, from_verse, to_verse });
  await assessmentService.markAssessmentProcessing(assessment.id);

  processInBackground(assessment.id, { surah_id, from_verse, to_verse }, file);

  return { ...assessment, status: 'processing' };
};

module.exports = { submitMemorizationCheck };
