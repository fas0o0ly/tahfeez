const { body, param } = require('express-validator');

const sessionIdParam = param('id')
  .isUUID()
  .withMessage('Session ID must be a valid UUID');

// POST /api/sessions/:id/token — no body needed, but param must be valid
const validateTokenRequest = [sessionIdParam];

// POST /api/sessions/:id/leave — optionally accept duration for attendance update
const validateLeaveRequest = [
  sessionIdParam,
  body('duration_seconds')
    .optional()
    .isInt({ min: 0 })
    .withMessage('duration_seconds must be a non-negative integer'),
];

// PUT /api/sessions/:id/end — teacher/admin ends session
const validateEndSession = [sessionIdParam];

module.exports = { validateTokenRequest, validateLeaveRequest, validateEndSession };