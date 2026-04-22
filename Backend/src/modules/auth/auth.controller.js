const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const data = await service.login(req, req.body);
  return sendSuccess(res, 'Login successful', data);
});

const refresh = asyncHandler(async (req, res) => {
  const data = await service.refresh(req.body.refreshToken);
  return sendSuccess(res, 'Token refreshed successfully', data);
});

const logout = asyncHandler(async (req, res) => {
  await service.logout(req, req.body.refreshToken);
  return sendSuccess(res, 'Logout successful');
});

const me = asyncHandler(async (req, res) => {
  const data = await service.me(req.user.id);
  return sendSuccess(res, 'Profile loaded successfully', data);
});

const changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body);
  return sendSuccess(res, 'Password changed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await service.forgotPassword(req.body.email);
  return sendSuccess(res, 'If the email exists, a reset token has been issued', data);
});

const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, 'Password reset successfully');
});

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
