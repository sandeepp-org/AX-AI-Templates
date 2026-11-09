# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY app ./app
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN pnpm build

# Stage 3: Prune dev dependencies
FROM builder AS pruned
RUN pnpm prune --prod

# Stage 4: Production (minimal: dist only, no source)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=pruned /app/package.json ./
COPY --from=pruned /app/pnpm-lock.yaml ./
COPY --from=pruned /app/pnpm-workspace.yaml ./
COPY --from=pruned /app/node_modules ./node_modules

# App: package.json, dist, and node_modules (pnpm places @aatmix deps here)
COPY --from=pruned /app/app/package.json ./app/
COPY --from=pruned /app/app/dist ./app/dist
COPY --from=pruned /app/app/node_modules ./app/node_modules

# Workspace packages (app node_modules/@aatmix/* symlinks into packages/)
COPY --from=pruned /app/packages ./packages

EXPOSE 3000
CMD ["sh", "-c", "node app/dist/index.js"]
