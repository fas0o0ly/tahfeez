// src/validators/quranValidator.js
const { param, query, body } = require('express-validator');

// ─── Param validators ──────────────────────────────────────────────────────

const validateSurahNumber = [
  param('number')
    .isInt({ min: 1, max: 114 })
    .withMessage('Surah number must be between 1 and 114')
    .toInt(),
];

const validatePageNumber = [
  param('page')
    .isInt({ min: 1, max: 604 })
    .withMessage('Page number must be between 1 and 604')
    .toInt(),
];

const validateJuzNumber = [
  param('number')
    .isInt({ min: 1, max: 30 })
    .withMessage('Juz number must be between 1 and 30')
    .toInt(),
];

const validateBookmarkId = [
  param('id')
    .isUUID()
    .withMessage('Invalid bookmark ID'),
];

// ─── Query validators ──────────────────────────────────────────────────────

const validateSurahListQuery = [
  query('revelation_type')
    .optional()
    .isIn(['meccan', 'medinan'])
    .withMessage('revelation_type must be meccan or medinan'),

  query('juz')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('juz must be between 1 and 30')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),
];

// ─── Body validators ───────────────────────────────────────────────────────

const validateUpsertBookmark = [
  body('surah_id')
    .isUUID()
    .withMessage('surah_id must be a valid UUID'),

  body('verse_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('verse_id must be a valid UUID'),

  body('label')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Label cannot exceed 100 characters'),

  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex code (e.g. #2D6A4F)'),
];

const validateReadingPosition = [
  body('surah_id')
    .isUUID()
    .withMessage('surah_id must be a valid UUID'),

  body('verse_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('verse_id must be a valid UUID'),

  body('page_number')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 604 })
    .withMessage('page_number must be between 1 and 604')
    .toInt(),
];

module.exports = {
  validateSurahNumber,
  validatePageNumber,
  validateJuzNumber,
  validateBookmarkId,
  validateSurahListQuery,
  validateUpsertBookmark,
  validateReadingPosition,
};