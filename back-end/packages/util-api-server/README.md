# @utils/api-server

Zero-boilerplate Express API server with built-in security, structured error handling, graceful shutdown, and optional SSE helpers.

`ApiServer` is a singleton-friendly class that wires helmet, CORS, rate limiting, compression, request-id middleware, method-aware routing, and process signal handlers -- all from a single `create()` call.

## Install

```bash
pnpm add @utils/api-server
```

Requires `@utils/logger` (workspace dependency):

```bash
pnpm add @utils/logger
```

## Quick Start

```typescript
import { ApiServer } from "@utils/api-server";
import { Logger } from "@utils/logger";

const logger = await Logger.create({
  context: "MyApp",
  transports: [{ type: "console" }],
});

const server = ApiServer.create({
  config: { PORT: 3001 },
  logger,
  routes: [
    {
      path: "/hello",
      version: "v1",
      method: "GET",
      handler: async (input, { logger }) => {
        logger.info("Hello handler called");
        return { message: "hello world" };
      },
    },
  ],
});

await server.start();
```

## With Custom Config

```typescript
import { ApiServer } from "@utils/api-server";
import { Logger } from "@utils/logger";

const logger = await Logger.create({
  level: "debug",
  context: "MyApp",
  transports: [
    { type: "console" },
    { type: "mongodb", uri: process.env.MONGODB_URI! },
  ],
});

const server = ApiServer.create({
  config: {
    PORT: 3001,
    API_PREFIX: "/api",
    ALLOWED_ORIGINS: ["http://localhost:3000"],
    BODY_LIMIT: "5mb",
    RATE_LIMIT_MAX: 200,
  },
  logger,
  onAppStart: async () => {
    // connect to database, warm caches, etc.
  },
  onAppStop: async () => {
    // disconnect, flush, cleanup
  },
  routes: [
    {
      path: "/users",
      version: "v1",
      handler: async (input, { logger, requestId }) => {
        logger.info("Fetching users", { filter: input });
        return [{ name: "alice" }];
      },
    },
  ],
});

// Add custom Express middleware before starting
server.expressApp.use(customAuthMiddleware);

await server.start();
```

## Singleton

```typescript
// Bootstrap: create() initializes and stores the singleton.
const server = ApiServer.create({
  logger,
  routes: [...],
});

// Elsewhere -- retrieve the same instance.
const server = ApiServer.getInstance();
```

## Built-in Health Endpoint

A `GET /health` endpoint is always registered at the root (outside `API_PREFIX`):

```
GET /health -> { "data": { "status": "ok", "uptime": 42.5 }, "error": null }
```

## Response Envelope

All routes return a uniform envelope:

```json
{
  "data": "<handler return value or null>",
  "error": "<error message string or null>"
}
```

On success, `data` has the value and `error` is `null`. On failure, `data` is `null` and `error` has the message.

## Swagger / OpenAPI

Swagger UI is auto-generated from your registered routes. Enable it with `SWAGGER_ENABLED: true`:

```typescript
const server = ApiServer.create({
  config: {
    PORT: 3001,
    SWAGGER_ENABLED: true,
    SWAGGER_TITLE: "My API",
    SWAGGER_DESCRIPTION: "My application API",
    SWAGGER_VERSION: "1.0.0",
    SWAGGER_PATH: "/docs",       // default
  },
  logger,
  routes: [
    { path: "/users", version: "v1", handler: async () => [...] },
    { path: "/orders", version: "v1", handler: async () => [...] },
  ],
});
```

Once the server starts, Swagger UI is available at `http://localhost:3001/docs/`. The OpenAPI spec is auto-generated from:

- `GET /health` -- built-in health endpoint
- `{METHOD} {API_PREFIX}/{version}{route.path}` -- for each route in your `routes` array
- Routes are grouped by version tags (e.g. `v1`, `v2`) in the Swagger UI

All routes document the `{ data, error }` response envelope. Swagger is disabled by default -- set `SWAGGER_ENABLED: false` or omit it to turn it off (e.g. in production).

## Using Custom Stores (Redis, MongoDB, Other)

`@util/api-server` uses `@util/rate-limit-core` internally. If you do not pass a store, rate limiting uses in-memory buckets by default.

### Pass a Redis store

```typescript
import { createClient } from "redis";
import { ApiServer } from "@util/api-server";
import type { RateLimitStore } from "@util/rate-limit-core";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const redisStore: RateLimitStore = {
  increment: async ({ bucketKey, windowMs, limit }) => {
    const count = await redis.incr(bucketKey);
    if (count === 1) {
      await redis.pExpire(bucketKey, windowMs);
    }
    const ttlMs = await redis.pTTL(bucketKey);
    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAtMs: Date.now() + Math.max(ttlMs, 0),
    };
  },
};

ApiServer.create({
  config: {
    RATE_LIMIT_STORE: redisStore,
  },
  logger,
  routes,
});
```

### Pass a MongoDB store

```typescript
import type { Collection } from "mongodb";
import type { RateLimitStore } from "@util/rate-limit-core";

const createMongoStore = (collection: Collection): RateLimitStore => ({
  increment: async ({ bucketKey, windowMs, limit }) => {
    const now = Date.now();
    const resetAtMs = now + windowMs;

    const doc = await collection.findOneAndUpdate(
      { bucketKey, resetAtMs: { $gt: now } },
      { $inc: { count: 1 }, $setOnInsert: { resetAtMs } },
      { upsert: true, returnDocument: "after" }
    );

    const count = doc?.count ?? 1;
    const finalResetAtMs = doc?.resetAtMs ?? resetAtMs;
    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAtMs: finalResetAtMs,
    };
  },
});

ApiServer.create({
  config: {
    RATE_LIMIT_STORE: createMongoStore(collection),
  },
  logger,
  routes,
});
```

### Any other store

Pass any adapter that implements `RateLimitStore.increment()`. This keeps the server package framework-agnostic at the rate-limit storage layer while preserving the same API.

## Rate-limit scopes by endpoint

Use `RouteDefinition.rateLimit` for per-endpoint policies. Use server-level resolver callbacks to enable user/org/api-key aware scopes.

### 1) Configure identity resolvers once

```typescript
import type { Request } from "express";

const server = ApiServer.create({
  config: {
    RATE_LIMIT_STORE: rateLimitStore,

    // Optional resolvers used by scoped keys
    RATE_LIMIT_GET_USER_ID: (req: Request) => {
      const authReq = req as Request & { auth?: { sub?: string } };
      return authReq.auth?.sub ?? null;
    },
    RATE_LIMIT_GET_ORG_ID: (req: Request) => {
      return (req.headers["x-org-id"] as string | undefined) ?? null;
    },
    RATE_LIMIT_GET_API_KEY_ID: (req: Request) => {
      return (req.headers["x-api-key"] as string | undefined) ?? null;
    },
  },
  logger,
  routes,
});
```

### 2) Per-endpoint route-level policies

```typescript
import { RATE_LIMIT_SCOPES } from "@util/rate-limit-core";

const routes: RouteDefinition[] = [
  // Per-API endpoint bucket
  {
    path: "/users",
    version: "v1",
    method: "GET",
    rateLimit: {
      policy: { windowMs: 60_000, max: 200, namespace: "users-list-route" },
      scope: RATE_LIMIT_SCOPES.ROUTE,
    },
    handler: async () => [],
  },
  // Per-user bucket for this endpoint
  {
    path: "/users/me",
    version: "v1",
    method: "GET",
    rateLimit: {
      policy: { windowMs: 60_000, max: 120, namespace: "users-me-user" },
      scope: RATE_LIMIT_SCOPES.USER,
    },
    handler: async () => ({}),
  },
  // Per-organization shared bucket for this endpoint
  {
    path: "/org/reports",
    version: "v1",
    method: "GET",
    rateLimit: {
      policy: { windowMs: 60_000, max: 1000, namespace: "org-reports-org" },
      scope: RATE_LIMIT_SCOPES.ORG,
    },
    handler: async () => ({}),
  },
  // Composite bucket: org + user + apiKey + route + client fallback
  {
    path: "/billing/export",
    version: "v1",
    method: "POST",
    rateLimit: {
      policy: {
        windowMs: 60_000,
        max: 30,
        namespace: "billing-export-composite",
      },
      scope: RATE_LIMIT_SCOPES.COMPOSITE,
    },
    handler: async () => ({ ok: true }),
  },
];
```

### Scope behavior quick reference

- `route`: separate bucket per endpoint.
- `user`: separate bucket per user (requires `RATE_LIMIT_GET_USER_ID`).
- `org`: shared bucket per organization (requires `RATE_LIMIT_GET_ORG_ID`).
- `apiKey`: separate bucket per API key (requires `RATE_LIMIT_GET_API_KEY_ID`).
- `composite`: combines org/user/apiKey/route/client dimensions.

If a required resolver is not provided (or returns `null`), the limiter falls back to anonymous segments, so requests are still rate-limited.

## API

### `ApiServer` class

| Method / Property          | Signature                                | Description                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `ApiServer.create(config)` | `(config: ApiServerConfig) => ApiServer` | Creates a new ApiServer instance and stores it as the singleton          |
| `ApiServer.getInstance()`  | `() => ApiServer`                        | Returns the singleton instance; throws if `create()` has not been called |
| `server.start()`           | `() => Promise<void>`                    | Starts listening, calls `onAppStart`, registers signal handlers          |
| `server.stop()`            | `() => Promise<void>`                    | Calls `onAppStop`, closes server, removes signal handlers                |
| `server.expressApp`        | `express.Application`                    | Underlying Express app for adding custom middleware                      |
| `server.port`              | `number`                                 | Actual port after `start()` (useful with `PORT: 0`)                      |

### `ApiServerConfig`

| Field        | Type                          | Default      | Description                      |
| ------------ | ----------------------------- | ------------ | -------------------------------- |
| `config`     | `ServerConfig`                | `{}`         | Server configuration (see below) |
| `logger`     | `Logger`                      | **required** | `@utils/logger` instance         |
| `onAppStart` | `() => Promise<void> \| void` | --           | Called during `start()`          |
| `onAppStop`  | `() => Promise<void> \| void` | --           | Called during `stop()`           |
| `routes`     | `RouteDefinition[]`           | **required** | Array of route definitions       |

### `ServerConfig`

| Field                       | Type                      | Default                    | Description                                            |
| --------------------------- | ------------------------- | -------------------------- | ------------------------------------------------------ |
| `PORT`                      | `number`                  | `3001`                     | Port to listen on (use `0` for random)                 |
| `API_PREFIX`                | `string`                  | `"/api"`                   | Prefix for all JSON routes                             |
| `ALLOWED_ORIGINS`           | `string[]`                | `[]` (all origins)         | CORS allowed origins                                   |
| `BODY_LIMIT`                | `string`                  | `"1mb"`                    | Max JSON body size                                     |
| `RATE_LIMIT_WINDOW_MS`      | `number`                  | `60000`                    | Rate limit window (ms)                                 |
| `RATE_LIMIT_MAX`            | `number`                  | `100`                      | Max requests per window per IP                         |
| `RATE_LIMIT_STORE`          | `RateLimitStore`          | in-memory default          | Optional external store adapter (Redis/MongoDB/custom) |
| `RATE_LIMIT_SCOPE`          | `RateLimitScope`          | `RATE_LIMIT_SCOPES.GLOBAL` | Default scope used by global limiter                   |
| `RATE_LIMIT_GET_ORG_ID`     | `(req) => string \| null` | --                         | Optional org identity resolver                         |
| `RATE_LIMIT_GET_USER_ID`    | `(req) => string \| null` | --                         | Optional user identity resolver                        |
| `RATE_LIMIT_GET_API_KEY_ID` | `(req) => string \| null` | --                         | Optional API key identity resolver                     |
| `SWAGGER_ENABLED`           | `boolean`                 | `false`                    | Enable Swagger UI                                      |
| `SWAGGER_PATH`              | `string`                  | `"/docs"`                  | Route where Swagger UI is served                       |
| `SWAGGER_TITLE`             | `string`                  | `"API"`                    | Title shown in Swagger UI                              |
| `SWAGGER_DESCRIPTION`       | `string`                  | `""`                       | Description shown in Swagger UI                        |
| `SWAGGER_VERSION`           | `string`                  | `"1.0.0"`                  | API version shown in Swagger UI                        |
| `SSE_HEARTBEAT_MS`          | `number`                  | `15000`                    | SSE heartbeat interval (ms)                            |

### `RouteDefinition`

| Field       | Type                                                  | Description                                                                        |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `path`      | `string`                                              | Route path (e.g. `"/users"`)                                                       |
| `version`   | `string`                                              | API version prefix (e.g. `"v1"`) -- routes mount at `{API_PREFIX}/{version}{path}` |
| `method`    | `HttpMethod`                                          | HTTP method (`POST` default)                                                       |
| `rateLimit` | `{ policy: RateLimitPolicy; scope?: RateLimitScope }` | Optional per-route policy override                                                 |
| `handler`   | `RouteHandler`                                        | `(input: unknown, context: RouteContext) => Promise<unknown> \| unknown`           |

## Server-Sent Events (SSE)

For real-time endpoints, use `createSseEndpoint()` to mount an SSE handler in Express and keep a `publish()` function you can call from anywhere in your codebase.

```typescript
import { createSseEndpoint } from "@utils/api-server";

const userEvents = createSseEndpoint({
  heartbeatMs: 15_000,
  openApi: { path: "/events/users", version: "v1", summary: "User events" },
  onConnect: ({ send, close, abortSignal }) => {
    send({ event: "connected", data: { ok: true } });
    abortSignal.addEventListener("abort", () => close(), { once: true });
  },
});

router.get("/v1/events/users", userEvents.handler);

// anywhere:
userEvents.publish({ event: "user.updated", data: { id: "123" } });
```

### SSE reconnect replay (`Last-Event-ID`)

`createSseEndpoint()` supports replaying missed events when clients reconnect with `Last-Event-ID`.
To enable replay, pass an `eventHistoryStore` implementation:

```typescript
import {
  createSseEndpoint,
  type SseEventHistoryStore,
} from "@utils/api-server";

const historyStore: SseEventHistoryStore = {
  appendEvent: async ({ event, context }) => {
    // Persist event in your store (Redis/DB/ring buffer)
  },
  getEventsAfter: async ({ afterEventId, context }) => {
    // Return ordered events where id > afterEventId
    return [];
  },
};

const userEvents = createSseEndpoint({
  heartbeatMs: 15_000,
  eventHistoryStore: historyStore,
});
```

Behavior:

- If `eventHistoryStore` is provided, `publish()` appends events for replay.
- On reconnect, the endpoint reads `Last-Event-ID`, replays `id > lastEventId`, then continues live streaming.
- If `eventHistoryStore` is omitted, SSE still works (live stream + reconnect), but replay is disabled.

### `RouteContext`

| Field       | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| `logger`    | `Logger` | Child logger with `{ requestId }` bound |
| `requestId` | `string` | UUID for the current request            |

### `HTTP_STATUS_CODES`

Exported constant object with standard HTTP status codes:

```typescript
HTTP_STATUS_CODES.OK; // 200
HTTP_STATUS_CODES.CREATED; // 201
HTTP_STATUS_CODES.BAD_REQUEST; // 400
HTTP_STATUS_CODES.UNAUTHORIZED; // 401
HTTP_STATUS_CODES.FORBIDDEN; // 403
HTTP_STATUS_CODES.NOT_FOUND; // 404
HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR; // 500
HTTP_STATUS_CODES.BAD_GATEWAY; // 502
HTTP_STATUS_CODES.SERVICE_UNAVAILABLE; // 503
```

## Security (applied automatically)

| Middleware           | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `helmet`             | Security HTTP headers                               |
| `cors`               | CORS with configurable origins                      |
| `compression`        | Gzip response compression                           |
| `express-rate-limit` | Brute-force / DDoS protection                       |
| `express.json`       | JSON body parser with size limit                    |
| request-id           | Auto-generated `X-Request-Id` header + child logger |

## Graceful Shutdown

Process signals (`SIGTERM`, `SIGINT`, `uncaughtException`, `unhandledRejection`) are handled automatically. On shutdown:

1. `onAppStop` callback is called
2. HTTP server closes (stops accepting new connections)
3. Logger flushes
4. Process exits

A 10-second safety timer forces exit if cleanup stalls.

## Package Structure

```
packages/utils-api-server/
├── docs/
│   └── plan.md
├── src/
│   ├── helpers/
│   │   ├── register-routes.util.ts
│   │   ├── register-routes.util.test.ts
│   │   ├── request-id.util.ts
│   │   ├── request-id.util.test.ts
│   │   ├── serialize-error.util.ts
│   │   ├── serialize-error.util.test.ts
│   │   ├── setup-security.util.ts
│   │   ├── setup-security.util.test.ts
│   │   ├── setup-signals.util.ts
│   │   └── setup-signals.util.test.ts
│   ├── constants.ts
│   ├── types.ts
│   ├── api-server.ts
│   ├── api-server.test.ts
│   └── index.ts
├── test.env
├── tsconfig.json
├── package.json
├── SKILL.md
└── README.md
```

## Scripts

```bash
pnpm build        # Compile TypeScript
pnpm test         # Run tests (Jest)
pnpm test:watch   # Watch mode
pnpm lint         # Lint source
pnpm typecheck    # Type-check without emit
pnpm clean        # Remove dist/
```

## Tests

```bash
cd packages/utils-api-server
pnpm test
```

Tests use real HTTP servers on random ports with real `fetch` requests (zero mocking).

## Monorepo template sync

From the repository root, use `pnpm template:ensure`, `template:add`, `template:update`, or `template:pr` (see root `package.json`) to pull packages from upstream or open a PR with `packages/*` changes.
