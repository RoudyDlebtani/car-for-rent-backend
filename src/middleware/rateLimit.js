// Rate limiters for the free public demo. Per-IP, standard RateLimit-* headers,
// and a JSON 429 that matches the API's { success, message } convention.
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

// Shared options + a JSON handler so limited responses look like every other error.
function makeLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false,  // drop the older X-RateLimit-* headers
    handler: (req, res) => {
      console.log('[rate-limit] 429', req.method, req.originalUrl, 'ip:', req.ip);
      res.status(429).json({ success: false, message: 'Too many requests — please slow down.' });
    },
  });
}

// All /api traffic — generous; normal browsing stays well under it.
const apiLimiter = makeLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
});

// Login + register only — throttles brute force and signup spam (the bcrypt/insert path).
const authLimiter = makeLimiter({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
});

// Favorites writes — bounds the only other DB insert.
const writeLimiter = makeLimiter({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.writeMax,
});

module.exports = { apiLimiter, authLimiter, writeLimiter };
