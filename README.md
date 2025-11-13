# Dockerized setup with Neon (Local for dev, Cloud for prod)

This repo includes a Docker setup for:
- Development: Express app + Neon Local (Dockerized serverless Postgres)
- Production: Express app connecting to Neon Cloud (managed Postgres)

---

## Prerequisites
- Docker and Docker Compose v2
- Neon account (for production DB URL)

## Environment files
The project uses these environment files:
- `.env.development` - for local development with Neon Local
- `.env.production` - for production deployment with Neon Cloud

Ensure these files exist with the correct values.

Key variable:
- `DATABASE_URL`
  - Dev (Neon Local, inside Compose network): `postgres://neon:npg@neon-local:5432/neondb?sslmode=disable&neon_branch=dev`
  - Prod (Neon Cloud): `postgres://USER:PASSWORD@<your-host>.neon.tech:5432/DB?sslmode=require`

You can change `neon_branch` (e.g. `?neon_branch=feature-123`) to create/use ephemeral branches with Neon Local.

---

## Start in development (Neon Local)

```bash
# build & run neon-local + app
docker compose -f docker-compose.dev.yml up --build

# app: http://localhost:3000
# db:  localhost:5432 (neon-local)
```

Or use the helper script (runs health checks and migrations):
```bash
bash scripts/dev.sh
```

Test endpoints with HTTPie (cookies persisted in a session called "acq"):
```bash
http --session=acq POST :3000/api/auth/sign-up name=Alice email=alice@example.com password=password123 role=user
http --session=acq POST :3000/api/auth/sign-in email=alice@example.com password=password123
http --session=acq POST :3000/api/auth/sign-out
```

---

## Start in production (Neon Cloud)

1) Set `.env.production` with your Neon Cloud `DATABASE_URL` and secrets.
2) Build & run:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

- App available at http://localhost:3000
- No Neon Local runs in production; the app connects directly to Neon Cloud via `DATABASE_URL`.

---

## How DATABASE_URL switches
- Dev: Compose loads `.env.development`; the app connects to `neon-local` service.
- Prod: Compose loads `.env.production`; the app connects to Neon Cloud.

---

## Notes
- Secrets are injected via environment files/variables; nothing is hardcoded in images.
- The default `Dockerfile` command runs `node src/index.js`. Dev Compose overrides with `npm run dev` (hot reload).
- Healthcheck pings `/health`; ensure that route stays available.
