// src/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
  }

  return result;
};

const getClient = () => pool.connect();

const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, testConnection, pool };