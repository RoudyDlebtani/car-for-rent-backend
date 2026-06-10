// PostgreSQL connection pool + a tiny query() helper.
const { Pool } = require('pg');
const config = require('../config/env');

// Build the pool from DATABASE_URL if present, otherwise from discrete PG* vars.
const poolConfig = config.databaseUrl
  ? { connectionString: config.databaseUrl, ssl: config.pgSsl ? { rejectUnauthorized: false } : false, max: config.pgPoolMax }
  : { ...config.pg, ssl: config.pgSsl ? { rejectUnauthorized: false } : false, max: config.pgPoolMax };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
});

// Verify connectivity once at startup so failures are obvious.
async function verifyConnection() {
  const { rows } = await pool.query('SELECT NOW() AS now');
  const target = config.databaseUrl ? '(DATABASE_URL)' : `${config.pg.host}:${config.pg.port}/${config.pg.database}`;
  console.log(`[db] Connected to ${target} — server time ${rows[0].now.toISOString()}`);
}

// Thin wrapper so callers don't import Pool directly.
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query, verifyConnection };
