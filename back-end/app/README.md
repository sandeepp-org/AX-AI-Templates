# app

Nexus API application: Express-based HTTP API with MongoDB, structured by domain modules (DDD + hexagonal style).

## Prerequisites

- Node.js >= 22
- pnpm (from repo root: `pnpm install`)
- MongoDB (optional; for user and other DB features)

## Environment

Create `.env` in `app/` (or set in shell). Required for the server; DB is optional.

| Variable                     | Required    | Description                                                           |
| ---------------------------- | ----------- | --------------------------------------------------------------------- |
| `PORT`                       | No          | HTTP port (default `3001`)                                            |
| `MONGODB_URI`                | If using DB | MongoDB connection string                                             |
| `MONGODB_DATABASE`           | No          | Database name (default `app`)                                         |
| `DB_SECRET_ID`               | No          | If set, URI is read from AWS Secrets Manager instead of `MONGODB_URI` |
| `REDIS_URL`                  | For auth    | Redis connection (default `redis://localhost:6379`)                   |
| `JWT_SECRET` / `AUTH_SECRET` | For auth    | HS256 JWT secret (min 32 chars)                                       |

Example `.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-at-least-32-characters-long
```

## Run

From **repository root**:

```bash
# Build all (packages + app)
pnpm build

# Run app (production)
pnpm start

# Build and run with watch (development)
pnpm dev
```

Or from `app/`:

```bash
pnpm build && pnpm start
pnpm dev
```

- **Swagger UI:** `http://localhost:3001/docs` (when `SWAGGER_ENABLED` is true).
- **SSE (example):** `http://localhost:3001/api/v1/events/users` (server-sent events).
- **Auth endpoints:** POST `/api/v1/auth/login`, POST `/api/v1/auth/refresh`, POST `/api/v1/auth/logout`, POST `/api/v1/auth/logout-all`, GET `/api/v1/auth/me`.

## Scripts

| Script           | Description                                      |
| ---------------- | ------------------------------------------------ |
| `pnpm build`     | Compile TypeScript to `dist/`                    |
| `pnpm start`     | Run `node dist/index.js`                         |
| `pnpm dev`       | Build then run with `node --watch dist/index.js` |
| `pnpm test`      | Run Jest for `app/`                              |
| `pnpm lint`      | Run ESLint on `src/`                             |
| `pnpm typecheck` | Run `tsc --noEmit`                               |

## SSE replay and Redis

The app wires SSE through `@util/api-server` and can use Redis-backed event replay:

- Endpoint wiring: `src/channels/http/user-events.sse.ts`
- Redis history store: `src/infrastructure/sse-redis-history-store.ts`

When enabled:

1. published SSE events are appended to Redis stream storage,
2. reconnect requests with `Last-Event-ID` replay missed events (`id > lastEventId`),
3. live streaming continues after replay.

If Redis is unavailable and you do not want replay semantics, remove `eventHistoryStore` from the SSE endpoint configuration; live SSE streaming still works without replay.

Operational notes:

- Configure Redis stream retention (for example via `MAXLEN` or periodic trimming) so replay history is bounded.
- Choose a retention window that matches the expected outage tolerance (for example, keep 1–5 minutes of events for short network blips).

## Folder structure

```
app/
├── docs/
│   └── plan.md          # Design and examples
├── src/
│   ├── auth/            # Auth module (schemas, service)
│   ├── channels/http/   # HTTP routes (user.routes, auth.routes)
│   ├── infrastructure/  # DB, Redis, external clients
│   ├── shared/          # Logger, secrets, shared utilities
│   ├── user/            # User module (entity, port, service, schema)
│   │   ├── entities/
│   │   ├── ports/
│   │   ├── schemas/
│   │   ├── service/
│   │   └── index.ts
│   └── index.ts         # Bootstrap: dotenv, server, DB, routes
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Example: Bootstrap

`src/index.ts` loads env, creates the API server with logger and routes, connects MongoDB when URI is set, and on shutdown closes DB and secrets:

```typescript
import { config } from "dotenv";
config();

import { ApiServer } from "@utils/api-server";
import { logger } from "./shared/logger/logger.js";
import { connectDb, getDb } from "./infrastructure/database.js";

const server = ApiServer.create({
  config: { PORT, SWAGGER_ENABLED: true, ... },
  logger,
  onAppStart: async () => {
    await connectDb();
    logger.info("App bootstrap complete");
  },
  onAppStop: async () => {
    try { await getDb().close(); } catch { /* DB not configured */ }
    await secrets.close();
  },
  routes: [...userRoutes],
});
await server.start();
```

## Example: MongoDB and user module

**1. Database** (`src/infrastructure/database.ts`)

- `connectDb()` reads URI from env (or AWS Secrets via `DB_SECRET_ID`), then `MongoDb.create({ uri, database, logger })` and `db.connect()`.
- `getDb()` returns `MongoDb.getInstance()` for use in services.

**2. User Zod schema** (`src/user/schemas/user.schema.ts`)

```typescript
import { z } from "zod";

const UserDocSchema = z.object({
  _id: z.unknown(),
  name: z.string(),
  email: z.string().optional(),
});
export { UserDocSchema };
```

**3. User service** (`src/user/service/user.service.ts`)

Uses `@utils/mongodb` collection API with Zod:

```typescript
const db = getDb();
const doc = await db.findOne({
  collection: "users",
  filter: { _id: new ObjectId(id) },
  schema: UserDocSchema,
});
return doc ? { id: String(doc._id), name: doc.name } : undefined;
```

**4. HTTP route** (`src/channels/http/user.routes.ts`)

```typescript
{
  path: "/users/get",
  handler: async (input, { logger }) => {
    const { id } = input as { id: string };
    const user = await userService.getById(id);
    return user ?? null;
  },
}
```

## Adding a new domain module

1. Create `src/<module>/entities/<name>.entity.ts` (types).
2. Create `src/<module>/ports/<name>-service.port.ts` (interface).
3. Create `src/<module>/schemas/` (Zod schemas for DB docs if needed).
4. Create `src/<module>/service/<name>.service.ts` (use `getDb()` or other infra).
5. Export from `src/<module>/index.ts`.
6. Add routes in `src/channels/http/<module>.routes.ts` and register in `src/index.ts`.

See `docs/plan.md` for dependency rules and more examples.
