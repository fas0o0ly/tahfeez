// src/controllers/userController.js
const userService = require('../services/userService');
const { success } = require('../utils/response');

const listUsers = async (req, res) => {
  const { role, status, search, page, limit } = req.query;

  const result = await userService.listUsers({
    role,
    status,
    search,
    page:  parseInt(page, 10)  || 1,
    limit: parseInt(limit, 10) || 20,
  });

  return success(res, result, 'Users retrieved successfully');
};

const getUserStats = async (req, res) => {
  const stats = await userService.getUserStats();
  return success(res, { stats }, 'Stats retrieved successfully');
};

const getPendingTeachers = async (req, res) => {
  const teachers = await userService.getPendingTeachers();
  return success(res, { teachers }, 'Pending teachers retrieved successfully');
};

const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return success(res, { user }, 'User retrieved successfully');
};

const updateUserStatus = async (req, res) => {
  const result = await userService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );

  const messages = {
    active:    'User account activated successfully',
    suspended: 'User account suspended',
    banned:    'User account banned',
    pending:   'User account set to pending',
  };

  return success(res, { status_change: result }, messages[req.body.status]);
};

const verifyTeacherIjazah = async (req, res) => {
  await userService.verifyTeacherIjazah(req.params.id, req.user.id);
  return success(res, null, 'Ijazah verified successfully');
};

const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  return success(res, null, 'User account deleted successfully');
};

module.exports = {
  listUsers,
  getUserStats,
  getPendingTeachers,
  getUserById,
  updateUserStatus,
  verifyTeacherIjazah,
  deleteUser,
};