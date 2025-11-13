#!/usr/bin/env bash
set -euo pipefail

# Production deployment script for Acquisition App

echo "🚀 Starting Acquisition App in Production Mode"
echo "==============================================="

if [ ! -f .env.production ]; then
  echo "❌ Error: .env.production file not found!"
  echo "   Please create .env.production with your production environment variables."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker is not running!"
  echo "   Please start Docker and try again."
  exit 1
fi

echo "📦 Building and starting production container..."
docker compose -f docker-compose.prod.yml up -d --build

# Basic wait for the app to respond
for i in {1..30}; do
  if docker inspect --format='{{json .State.Health.Status}}' acquisition-app-prod 2>/dev/null | grep -q '"healthy"'; then
    echo "✅ App is healthy"
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "⚠️  App health check not healthy yet; continuing to migrations"
  fi
done

# Run migrations inside the container
echo "📜 Applying latest schema with Drizzle..."
docker compose -f docker-compose.prod.yml exec app npm run db:migrate || true

echo "🎉 Production environment started!"
echo "   Application: http://localhost:3000"
echo "   Logs: docker logs acquisition-app-prod"
echo "Useful commands:"
echo "   View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop app:  docker compose -f docker-compose.prod.yml down"