---
name: docker-guide
description: Docker build and run guide for this monorepo (multi-stage build, .dockerignore, compose).
metadata:
  version: "1.0"
---

# Docker Guide

Use this skill when writing or updating the `Dockerfile`, `.dockerignore`, or basic Docker Compose for this monorepo.

## Multi-stage Build

The Dockerfile uses 4 stages for a minimal production image:

1. **deps**: Install all dependencies.
2. **builder**: Build TypeScript.
3. **pruned**: Remove devDependencies (`pnpm prune --prod`).
4. **runner**: Minimal image — only `package.json` + `dist/` per package (no `src/`, tests).

```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY app/package.json ./app/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN pnpm build

# Stage 3: Prune
FROM builder AS pruned
RUN pnpm prune --prod

# Stage 4: Run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=pruned /app/package.json ./
COPY --from=pruned /app/pnpm-lock.yaml ./
COPY --from=pruned /app/pnpm-workspace.yaml ./
COPY --from=pruned /app/node_modules ./node_modules

# Add COPY lines per package when packages exist (e.g. packages/util-logger, etc.)
# COPY --from=pruned /app/packages/util-<name>/package.json ./packages/util-<name>/
# COPY --from=pruned /app/packages/util-<name>/dist ./packages/util-<name>/dist

COPY --from=pruned /app/app/package.json ./app/
COPY --from=pruned /app/app/dist ./app/dist

EXPOSE 3000
CMD ["sh", "-c", "node app/dist/index.js"]
```

## Building

```bash
# Build app
docker build -t <app-name> .

# With env file (build-time secret)
docker build -t <app-name> \
  --secret id=env,src=.env \
  .
```

## Running

```bash
# Basic run
docker run -p 3000:3000 <app-name>

# With individual environment variables
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI=mongodb://... \
  <app-name>

# With env file
docker run -p 3000:3000 --env-file .env <app-name>
```

## .dockerignore

Recommended `.dockerignore`:

```text
node_modules
dist
*.tsbuildinfo
.git
.env
.env.*
coverage
.turbo
```

## Docker Compose (example)

```yaml
version: "3.8"
services:
  api:
    build:
      context: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
```

## Optimization Tips

- Use `node:22-alpine` for smaller images.
- Use `--frozen-lockfile` in CI.
- Run `pnpm prune --prod` before the final copy to remove devDependencies.
- Copy only `package.json` + `dist/` per package (no `src/`, tests, `*.ts`).
- Set `NODE_ENV=production`.
- Do **not** copy `.env` into the image; inject env at runtime.
