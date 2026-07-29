const { query } = require('../config/db');

const createNotification = async (userId, type, title, body, meta = null) => {
  await query(
    `INSERT INTO notifications (user_id, type, title, body, meta)
     VALUES ($1, $2::notification_type, $3, $4, $5)`,
    [userId, type, title, body, meta ? JSON.stringify(meta) : null]
  );
};

module.exports = { createNotification };
