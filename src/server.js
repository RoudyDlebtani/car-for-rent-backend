const express = require('express');
const cors = require('cors');

const config = require('./config/env');
const { verifyConnection } = require('./db/pool');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');
 
const vehiclesRouter = require('./routes/vehicles');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');

const app = express();

// Trust the first proxy hop so rate limiting keys off the real client IP when
// deployed behind a host's reverse proxy (Render/Railway/Fly/etc.).
app.set('trust proxy', 1);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: config.clientOrigin })); // allow the React dev server
app.use(express.json());

// Generous global rate limit on the whole API (cheap GETs); the auth + favorites
// write routes add their own stricter limits.
app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Cars for Rent API is running' });
});

app.get('/api/health', async (req, res, next) => {
  try {
    const { rows } = await require('./db/pool').query('SELECT NOW() AS now');
    res.json({ ok: true, db: rows[0].now });
  } catch (err) {
    next(err);
  }
});

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);

// ── 404 + error handling ──────────────────────────────────────────────────────
app.use((req, res) => {
  console.log('[404] Route not found:', req.method, req.originalUrl);
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await verifyConnection(); // fail fast if the DB is unreachable
  } catch (err) {
    console.error('[startup] Could not connect to PostgreSQL:', err.message);
    console.error('[startup] Check that the server is running and .env (PGPASSWORD/PGDATABASE) is correct.');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log('─────────────────────────────────────────────');
    console.log('  Cars for Rent — Backend API');
    console.log(`  Listening on http://localhost:${config.port}`);
    console.log(`  CORS origin:  ${config.clientOrigin}`);
    console.log('─────────────────────────────────────────────');
    console.log('[TEST] GET    /api/health');
    console.log('[TEST] GET    /api/categories');
    console.log('[TEST] GET    /api/vehicles            ?category= &class= &city= &q= &featured= &sort= &limit=');
    console.log('[TEST] GET    /api/vehicles/featured');
    console.log('[TEST] GET    /api/vehicles/:slug');
    console.log('[TEST] POST   /api/auth/register       { email, password, display_name }');
    console.log('[TEST] POST   /api/auth/login          { email, password }');
    console.log('[TEST] GET    /api/auth/me             (Bearer token)');
    console.log('[TEST] GET    /api/favorites           (Bearer token)');
    console.log('[TEST] POST   /api/favorites/:vehicleId (Bearer token)');
    console.log('[TEST] DELETE /api/favorites/:vehicleId (Bearer token)');
    console.log('─────────────────────────────────────────────');
    console.log('  Demo login → demo@rental.test / demo1234');
    console.log('─────────────────────────────────────────────');
  });
}

// Only start a long-lived server when run directly (local dev / Render).
// On Vercel the app is imported by api/index.js and served per-request,
// so there is no listen() and no fail-fast exit on cold starts.
if (require.main === module) {
  start();
}

module.exports = app;
