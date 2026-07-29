// src/services/uploadService.js
const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middleware/errorHandler');

// Upload a file buffer to Cloudinary
const uploadAvatar = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:         'tahfeez/avatars',
        public_id:      `user_${userId}`,
        overwrite:      true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => {
        if (err) return reject(new AppError('Image upload failed. Please try again.', 500));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

// Delete avatar from Cloudinary by user ID
const deleteAvatar = async (userId) => {
  try {
    await cloudinary.uploader.destroy(`tahfeez/avatars/user_${userId}`);
  } catch {
    // Non-blocking — if deletion fails, don't crash the request
  }
};

// Upload audio buffer to Cloudinary (resource_type 'video' covers audio files)
const uploadAudio = (buffer, assessmentId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder:        'tahfeez/recitations',
        public_id:     `recitation_${assessmentId}`,
        overwrite:     true,
      },
      (err, result) => {
        if (err) return reject(new AppError('Audio upload failed. Please try again.', 500));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// Delete recitation audio from Cloudinary
const deleteAudio = async (assessmentId) => {
  try {
    await cloudinary.uploader.destroy(
      `tahfeez/recitations/recitation_${assessmentId}`,
      { resource_type: 'video' }
    );
  } catch {
    // Non-blocking
  }
};

module.exports = { uploadAvatar, deleteAvatar, uploadAudio, deleteAudio };