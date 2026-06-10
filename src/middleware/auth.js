const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Require a valid "Authorization: Bearer <token>" header; sets req.user = { id, email }.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    console.log('[auth] Missing bearer token on', req.method, req.originalUrl);
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    console.log('[auth] Invalid token:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
