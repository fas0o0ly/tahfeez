const { param, query, body } = require('express-validator');

const periodValidator = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year', 'all'])
    .withMessage('period must be week, month, year, or all'),
];

const studentIdParam = [
  param('studentId').isUUID().withMessage('studentId must be a valid UUID'),
];

const sessionIdParam = [
  param('sessionId').isUUID().withMessage('sessionId must be a valid UUID'),
];

const teacherIdParam = [
  param('teacherId').isUUID().withMessage('teacherId must be a valid UUID'),
];

const issueCertificateValidator = [
  body('title')
    .isString().trim().notEmpty().withMessage('title is required')
    .isLength({ max: 200 }).withMessage('title must be under 200 characters'),
  body('certificate_type')
    .isIn(['full_quran', 'half_quran', 'juz', 'custom'])
    .withMessage('certificate_type must be full_quran, half_quran, juz, or custom'),
  body('accuracy_grade')
    .optional({ nullable: true })
    .isIn(['excellent', 'very_good', 'good', 'acceptable', 'weak'])
    .withMessage('Invalid accuracy grade'),
  body('juz_from').optional({ nullable: true }).isInt({ min: 1, max: 30 }),
  body('juz_to').optional({ nullable: true }).isInt({ min: 1, max: 30 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 1000 }),
  body('session_id').optional({ nullable: true }).isUUID(),
  body('certificate_url').optional({ nullable: true }).isURL(),
];

const awardMedalValidator = [
  body('achievement_type_id')
    .isUUID().withMessage('achievement_type_id must be a valid UUID'),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('session_id').optional({ nullable: true }).isUUID(),
];

const certIdParam = [param('id').isUUID().withMessage('id must be a valid UUID')];

module.exports = {
  periodValidator,
  studentIdParam,
  sessionIdParam,
  teacherIdParam,
  issueCertificateValidator,
  awardMedalValidator,
  certIdParam,
};
