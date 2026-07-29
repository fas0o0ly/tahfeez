const express = require('express');
const ctrl          = require('../controllers/certificateController');
const { authenticate }  = require('../middleware/auth');
const { authorize }     = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const { asyncHandler }  = require('../middleware/errorHandler');
const {
  studentIdParam,
  issueCertificateValidator,
  awardMedalValidator,
  certIdParam,
} = require('../validators/reportingValidators');

const router = express.Router();
router.use(authenticate);

// Achievement types list (all authenticated roles)
router.get(
  '/achievements/types',
  authorize('admin', 'teacher', 'student'),
  asyncHandler(ctrl.getAchievementTypes)
);

// Student achievements
router.get(
  '/achievements/student/:studentId',
  authorize('admin', 'teacher', 'student'),
  studentIdParam, validate,
  asyncHandler(ctrl.getAchievements)
);

router.post(
  '/achievements/student/:studentId',
  authorize('admin', 'teacher'),
  [...studentIdParam, ...awardMedalValidator], validate,
  asyncHandler(ctrl.awardMedal)
);

router.delete(
  '/achievements/:id',
  authorize('admin'),
  certIdParam, validate,
  asyncHandler(ctrl.revokeMedal)
);

// Certificates
router.get(
  '/student/:studentId',
  authorize('admin', 'teacher', 'student'),
  studentIdParam, validate,
  asyncHandler(ctrl.getCertificates)
);

router.post(
  '/student/:studentId',
  authorize('admin', 'teacher'),
  [...studentIdParam, ...issueCertificateValidator], validate,
  asyncHandler(ctrl.issueCertificate)
);

router.delete(
  '/:id',
  authorize('admin'),
  certIdParam, validate,
  asyncHandler(ctrl.revokeCertificate)
);

module.exports = router;
