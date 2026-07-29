// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { unauthorized } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Access token required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Confirm user still exists and is active
    const result = await query(
      'SELECT id, role, status, email, full_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      return unauthorized(res, `Account is ${user.status}`);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Access token expired');
    }
    return unauthorized(res, 'Invalid access token');
  }
};

module.exports = { authenticate };