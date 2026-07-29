// src/middleware/role.js
const { forbidden } = require('../utils/response');

// Usage: authorize('admin') or authorize('admin', 'teacher')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, 'You do not have permission to access this resource');
    }

    next();
  };
};

module.exports = { authorize };