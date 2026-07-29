// src/api/quranApi.js
import api from './axiosInstance';

// ─── Surah list ────────────────────────────────────────────────────────────
export const fetchSurahs = (params = {}) =>
  api.get('/quran/surahs', { params });

export const fetchSurahByNumber = (number) =>
  api.get(`/quran/surahs/${number}`);

// ─── Navigation ────────────────────────────────────────────────────────────
export const fetchPage = (page) =>
  api.get(`/quran/pages/${page}`);

export const fetchJuz = (number) =>
  api.get(`/quran/juz/${number}`);

// ─── Bookmarks ─────────────────────────────────────────────────────────────
export const fetchBookmarks = () =>
  api.get('/quran/bookmarks');

export const upsertBookmark = (data) =>
  api.post('/quran/bookmarks', data);

export const deleteBookmark = (id) =>
  api.delete(`/quran/bookmarks/${id}`);

// ─── Reading position ──────────────────────────────────────────────────────
export const fetchReadingPosition = () =>
  api.get('/quran/reading-position');

export const saveReadingPosition = (data) =>
  api.put('/quran/reading-position', data);

// ─── Verse notes ───────────────────────────────────────────────────────────
export const fetchNotes = () =>
  api.get('/quran/notes');

export const upsertNote = (verse_id, content) =>
  api.post('/quran/notes', { verse_id, content });

export const deleteNoteByVerse = (verse_id) =>
  api.delete(`/quran/notes/${verse_id}`);