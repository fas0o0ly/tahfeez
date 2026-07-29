// One-time script: run from the backend directory
// Usage: node runMigration.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const file = path.join(__dirname, '..', '009_reports_and_certs.sql');
const sql  = fs.readFileSync(file, 'utf8');

(async () => {
  const client = await pool.connect();
  try {
    console.log('Running migration: 009_reports_and_certs.sql ...');
    await client.query(sql);
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
