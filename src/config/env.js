// Loads .env and exposes typed config in one place.
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

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
  console.warn('[config] WARNING: JWT_SECRET not set — using an insecure dev default.');
}

module.exports = config;
