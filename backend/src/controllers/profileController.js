// src/controllers/profileController.js
const profileService = require('../services/profileService');
const { success } = require('../utils/response');
const { handleAvatarUpload } = require('../middleware/upload');

const getProfile = async (req, res) => {
  const profile = await profileService.getOwnProfile(req.user.id, req.user.role);
  return success(res, { profile }, 'Profile retrieved successfully');
};

const updateProfile = async (req, res) => {
  const profile = await profileService.updateOwnProfile(
    req.user.id,
    req.user.role,
    req.body
  );
  return success(res, { profile }, 'Profile updated successfully');
};

const uploadAvatar = async (req, res) => {
  // Parse multipart form — waits for the file buffer to be ready
  await handleAvatarUpload(req, res);

  const avatarUrl = await profileService.updateAvatar(req.user.id, req.file?.buffer);
  return success(res, { avatar_url: avatarUrl }, 'Avatar updated successfully');
};

const removeAvatar = async (req, res) => {
  await profileService.removeAvatar(req.user.id);
  return success(res, null, 'Avatar removed successfully');
};

module.exports = { getProfile, updateProfile, uploadAvatar, removeAvatar };