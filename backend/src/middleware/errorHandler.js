// src/middleware/errorHandler.js
const logger = require('../utils/logger');
const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Postgres unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return error(res, `${field} already exists`, 409);
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return error(res, 'Referenced resource does not exist', 400);
  }

  // Postgres not null violation
  if (err.code === '23502') {
    return error(res, `Missing required field: ${err.column}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401);
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return error(res, 'Validation failed', 422, err.errors);
  }

  // Known operational errors
  if (err.isOperational) {
    return error(res, err.message, err.statusCode || 500);
  }

  // Unknown — don't leak internals in production
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return error(res, message, 500);
};

// Wraps async route handlers — eliminates try/catch boilerplate
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Simple operational error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, asyncHandler, AppError };