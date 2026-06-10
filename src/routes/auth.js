const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { findByEmail, createUser } = require('../db/queries/users');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, display_name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'password must be at least 6 characters' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Unique-violation (duplicate email) is handled by the error middleware -> 409.
  const user = await createUser({ email, passwordHash, displayName: display_name });

  console.log('[POST /api/auth/register] New user:', user.email);
  res.status(201).json({ success: true, token: signToken(user), user });
}));

// POST /api/auth/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const user = await findByEmail(email);
  // bcryptjs verifies both app-created hashes and the seeded pgcrypto bcrypt ($2a$) hash.
  const ok = user && user.is_active && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    console.log('[POST /api/auth/login] Failed login for:', email);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const publicUser = { id: user.id, email: user.email, display_name: user.display_name };
  console.log('[POST /api/auth/login] OK:', user.email);
  res.json({ success: true, token: signToken(publicUser), user: publicUser });
}));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await findByEmail(req.user.email);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({
    success: true,
    user: { id: user.id, email: user.email, display_name: user.display_name },
  });
}));

module.exports = router;
