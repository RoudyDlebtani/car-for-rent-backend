# backend-cars-for-rent

Node/Express + PostgreSQL API for the **Cars for Rent** demo. Talks to the `my-rental-car`
database (see `../database`). Raw `pg` (no ORM), JWT auth, demo-only.

## Setup

```bash
cd backend-cars-for-rent
npm install
cp .env.example .env        # then fill PGPASSWORD (and JWT_SECRET)
npm run dev                  # nodemon, or: npm start
```

On boot it verifies the DB connection and prints the available endpoints. If the DB is
unreachable it exits with a hint — make sure your Postgres server is running and `.env` is correct.

## Endpoints (base `http://localhost:5000`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | — | `{ ok, db: <NOW()> }` |
| GET | `/api/categories` | — | with available-vehicle counts |
| GET | `/api/vehicles` | — | filters: `category`, `class`, `city`, `q`, `featured`, `available`, `sort` (`price_asc`/`price_desc`/`newest`), `limit`, `offset` |
| GET | `/api/vehicles/featured` | — | Top Picks |
| GET | `/api/vehicles/:slug` | — | detail + images + features |
| POST | `/api/auth/register` | — | `{ email, password, display_name }` → `{ token, user }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | current user |
| GET | `/api/favorites` | Bearer | saved vehicles |
| POST | `/api/favorites/:vehicleId` | Bearer | `{ notes? }` |
| DELETE | `/api/favorites/:vehicleId` | Bearer | — |

## Quick test

```bash
curl localhost:5000/api/vehicles?featured=true
curl localhost:5000/api/vehicles/lamborghini-urus-2024

TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@rental.test","password":"demo1234"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')

curl localhost:5000/api/favorites -H "Authorization: Bearer $TOKEN"
```

**Demo login:** `demo@rental.test` / `demo1234`

## Deployment note
Config is env-driven. To deploy on Neon/Supabase + Render, set `DATABASE_URL` and `PGSSL=true`
instead of the discrete `PG*` vars — no code changes needed.
