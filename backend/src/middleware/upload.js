// src/middleware/upload.js
const multer = require('multer');
const { AppError } = require('./errorHandler');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

// Store in memory — we stream directly to Cloudinary, never touch disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
  cb(null, true);
};

const audioFileFilter = (req, file, cb) => {
  if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Unsupported audio format', 400), false);
  }
  cb(null, true);
};

const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE },
}).single('avatar');

const audioUpload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: MAX_AUDIO_SIZE },
}).single('audio');

// Wrap multer in a promise so we can use async/await in controllers
const handleAvatarUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    avatarUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(new AppError('Image must be under 5MB', 400));
        }
        return reject(new AppError(err.message, 400));
      }
      if (err) return reject(err);
      resolve();
    });
  });
};

const handleAudioUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    audioUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(new AppError('Audio must be under 25MB', 400));
        }
        return reject(new AppError(err.message, 400));
      }
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = { handleAvatarUpload, handleAudioUpload };