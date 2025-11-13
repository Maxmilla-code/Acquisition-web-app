#!/usr/bin/env bash
set -euo pipefail

# Development startup script for Acquisition App with Neon Local

echo "🚀 Starting Acquisition App in Development Mode"
echo "================================================"

if [ ! -f .env.development ]; then
  echo "❌ Error: .env.development file not found!"
  echo "   Please create .env.development with your Neon credentials."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker is not running!"
  echo "   Please start Docker Desktop and try again."
  exit 1
fi

mkdir -p .neon_local
if ! grep -q "^.neon_local/" .gitignore 2>/dev/null; then
  echo ".neon_local/" >> .gitignore
  echo "✅ Added .neon_local/ to .gitignore"
fi

echo "📦 Building and starting development containers..."
docker compose -f docker-compose.dev.yml up -d --build

echo "⏳ Waiting for services to become healthy..."
# Wait for neon-local health
for i in {1..30}; do
  if docker inspect --format='{{json .State.Health.Status}}' acquisition-neon-local | grep -q '"healthy"'; then
    echo "✅ neon-local is healthy"
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "❌ neon-local did not become healthy in time"; exit 1
  fi
done

# Run migrations inside the app container (has env & network)
echo "📜 Applying latest schema with Drizzle..."
docker compose -f docker-compose.dev.yml exec app npm run db:migrate || true

echo "🎉 Development environment started!"
echo "   Application: http://localhost:3000"
echo "   Database:    postgres://neon:npg@localhost:5432/neondb"
echo "To follow logs: docker compose -f docker-compose.dev.yml logs -f"
