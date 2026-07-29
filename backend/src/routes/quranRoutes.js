// src/routes/quranRoutes.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const {
  getSurahs,
  getSurahByNumber,
  getVersesByPage,
  getVersesByJuz,
  getBookmarks,
  upsertBookmark,
  deleteBookmark,
  getReadingPosition,
  upsertReadingPosition,
  getNotes,
  saveNote,
  deleteNote,
} = require('../controllers/quranController');

const {
  validateSurahNumber,
  validatePageNumber,
  validateJuzNumber,
  validateBookmarkId,
  validateSurahListQuery,
  validateUpsertBookmark,
  validateReadingPosition,
} = require('../validators/quranValidator');

// ─── Quran content ─────────────────────────────────────────────────────────
router.get(
  '/surahs',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateSurahListQuery,
  validate,
  getSurahs
);

router.get(
  '/surahs/:number',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateSurahNumber,
  validate,
  getSurahByNumber
);

router.get(
  '/pages/:page',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validatePageNumber,
  validate,
  getVersesByPage
);

router.get(
  '/juz/:number',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateJuzNumber,
  validate,
  getVersesByJuz
);

// ─── Bookmarks ─────────────────────────────────────────────────────────────
router.get(
  '/bookmarks',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  getBookmarks
);

router.post(
  '/bookmarks',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateUpsertBookmark,
  validate,
  upsertBookmark
);

router.delete(
  '/bookmarks/:id',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateBookmarkId,
  validate,
  deleteBookmark
);

// ─── Reading position ──────────────────────────────────────────────────────
router.get(
  '/reading-position',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  getReadingPosition
);

router.put(
  '/reading-position',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validateReadingPosition,
  validate,
  upsertReadingPosition
);

// ─── Verse notes ───────────────────────────────────────────────────────────
router.get(
  '/notes',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  getNotes
);

router.post(
  '/notes',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  saveNote
);

router.delete(
  '/notes/:verse_id',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  deleteNote
);

module.exports = router;