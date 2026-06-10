const { query } = require('../pool');

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, email, password_hash, display_name, is_active
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function createUser({ email, passwordHash, displayName }) {
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name, created_at`,
    [email, passwordHash, displayName || null]
  );
  return rows[0];
}

module.exports = { findByEmail, createUser };
