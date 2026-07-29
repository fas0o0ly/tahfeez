const express = require('express');
const router  = express.Router();

const { authenticate }  = require('../middleware/auth');
const { authorize }     = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const {
  validateTokenRequest,
  validateLeaveRequest,
  validateEndSession,
} = require('../validators/agoraValidators');
const {
  getToken, leaveSession, endSession, getParticipants,
  sendSignal, getSignals, clearHandRaise,
} = require('../controllers/agoraController');

router.use(authenticate);

router.post('/:id/token',        authorize('teacher', 'student', 'admin'), validateTokenRequest, validate, getToken);
router.post('/:id/leave',        authorize('teacher', 'student', 'admin'), validateLeaveRequest,  validate, leaveSession);
router.put( '/:id/end',          authorize('teacher', 'admin'),            validateEndSession,    validate, endSession);
router.get( '/:id/participants', authorize('teacher', 'student', 'admin'), getParticipants);

// Signaling
router.post(  '/:id/signal',       authorize('teacher', 'student', 'admin'), sendSignal);
router.get(   '/:id/signals',      authorize('teacher', 'student', 'admin'), getSignals);
router.delete('/:id/signal/hand',  authorize('teacher', 'admin'),            clearHandRaise);

module.exports = router;