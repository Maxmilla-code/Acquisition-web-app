# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-bullseye-slim

# Base stage
FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Install dependencies (only package files for better caching)
COPY package.json package-lock.json* ./
RUN npm ci || npm i --no-audit --no-fund

# Copy source
COPY . .

# Development stage
FROM base AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get(`http://localhost:${process.env.PORT||3000}/health`, r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["npm", "start"]
