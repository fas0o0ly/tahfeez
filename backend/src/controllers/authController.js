// src/controllers/authController.js
const authService = require('../services/authService');
const { success, created } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const register = async (req, res) => {
  const user = await authService.register(req.body);

  return created(res, {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  }, 'Registration successful. Please check your email to verify your account.');
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Verification token is required' });
  }

  const { requiresApproval } = await authService.verifyEmail(token);
  const message = requiresApproval
    ? 'Email verified successfully. Your teacher account is now awaiting admin approval before you can log in.'
    : 'Email verified successfully. You can now log in.';
  return success(res, { requires_approval: requiresApproval }, message);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
    ipAddress,
    userAgent
  );

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return success(res, { user, accessToken }, 'Login successful');
};

const refreshToken = async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(rawRefreshToken);
  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
  return success(res, { accessToken }, 'Token refreshed');
};

const logout = async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;
  await authService.logout(rawRefreshToken);

  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
  return success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  // Always return the same response — never reveal if email exists
  return success(
    res,
    null,
    'If an account with that email exists, a password reset link has been sent.'
  );
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return success(res, null, 'Password reset successfully. Please log in.');
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  await authService.changePassword(req.user.id, current_password, new_password);
  return success(res, null, 'Password changed successfully. Please log in again.');
};

const getMe = async (req, res) => {
  const profile = await authService.getProfile(req.user.id, req.user.role);
  return success(res, { profile });
};

const resendVerification = async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationEmail(email);
  return success(
    res,
    null,
    'If that email exists and is unverified, a new verification link has been sent.'
  );
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  resendVerification,
};