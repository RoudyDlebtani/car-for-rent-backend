// Loads .env and exposes typed config in one place.
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  // Allowed CORS origins. CLIENT_ORIGIN may be a comma-separated list; default
  // covers both common CRA dev ports (3000, and 3001 when 3000 is taken).
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Either a single DATABASE_URL or discrete PG* vars.
  databaseUrl: process.env.DATABASE_URL || null,
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'my-rental-car',
  },
  // Enable SSL for hosted Postgres (Neon/Supabase). Off for local.
  pgSsl: String(process.env.PGSSL || '').toLowerCase() === 'true',

  // Pool size per process. Serverless (Vercel) runs many short-lived instances,
  // each with its own pool, so keep it small there to avoid exhausting Neon's
  // connection limit. Override with PG_POOL_MAX.
  pgPoolMax: parseInt(process.env.PG_POOL_MAX || (process.env.VERCEL ? '2' : '10'), 10),

  // Rate limiting — protects the free demo. Generous global limit on all reads,
  // strict limits on the only DB-writing paths (auth + favorites writes).
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),       // global: 1 min
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),                    // global: 100 / IP / min
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10), // 15 min
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),            // login+register: 10 / IP / 15 min
    writeMax: parseInt(process.env.RATE_LIMIT_WRITE_MAX || '40', 10),          // favorites writes: 40 / IP / 15 min (shares authWindowMs)
  },
};

if (config.jwtSecret === 'dev-insecure-secret-change-me') {
  // In production a forgotten JWT_SECRET would make every token forgeable —
  // refuse to boot instead of shipping that silently.
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('[config] JWT_SECRET must be set in production. Add it to the host\'s environment variables.');
  }
  console.warn('[config] WARNING: JWT_SECRET not set — using an insecure dev default.');
}

module.exports = config;
