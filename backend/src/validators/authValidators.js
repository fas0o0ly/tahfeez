// src/validators/authValidators.js
const { body } = require('express-validator');

const registerValidator = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Full name must be 2–150 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),

  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['male', 'female']).withMessage('Gender must be male or female'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Invalid phone number'),

  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Nationality too long'),

  body('date_of_birth')
    .notEmpty().withMessage('Date of birth is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid date of birth format'),

  body('preferred_language')
    .notEmpty().withMessage('Preferred language is required')
    .isIn(['arabic', 'english', 'malay', 'urdu', 'french', 'other'])
    .withMessage('Invalid language selection'),

  body('cv_url')
    .optional()
    .trim()
    .isURL().withMessage('CV must be a valid URL'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const changePasswordValidator = [
  body('current_password')
    .notEmpty().withMessage('Current password is required'),

  body('new_password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must differ from current password');
      }
      return true;
    }),
];

const resendVerificationValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  resendVerificationValidator,
};