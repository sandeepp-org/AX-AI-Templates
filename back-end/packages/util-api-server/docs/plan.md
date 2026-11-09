# @util/api-server -- Design Plan

Zero-boilerplate Express API server with built-in security, structured error handling, and graceful shutdown. Consumers call one factory method, pass their routes and logger, and get a production-ready server.

Ported from [cau-api-server](../../../cau-api-server/) and adapted to Nexus monorepo conventions.

---

## 1. Goals

| Goal                         | Detail                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Zero boilerplate             | Single `create()` call wires everything -- security, CORS, body parsing, routing, error handling, signal traps |
| Method-aware routing         | Routes can use POST/GET/PUT/PATCH/DELETE with a uniform `{ data, error }` response envelope                    |
| Versioned routing            | Each route declares a `version` (e.g. `"v1"`); routes mount at `{apiPrefix}/{version}{path}`                   |
| Framework-agnostic interface | Public types do not leak Express types; swapping Express later requires only internal changes                  |
| Security by default          | Helmet, CORS, rate limiting, compression, JSON body limits -- all applied automatically                        |
| Graceful lifecycle           | Process signals (SIGTERM, SIGINT, unhandledRejection, uncaughtException) handled out of the box                |
| Logging via @util/logger     | All internal logging goes through the logger instance passed by the app                                        |
| Optional SSE helper          | Express-first SSE helper returns `handler` + `publish()` for real-time endpoints                               |

---

## 2. Nexus Adaptations (from cau-api-server)

| cau-api-server                | Nexus package                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `cau-logger`                  | `@util/logger` (workspace dependency)                                         |
| `config.ts` with dotenv       | No dotenv; defaults in `constants.ts`, resolved from `ApiServerConfig.config` |
| Vitest                        | Jest                                                                          |
| Logger optional (auto-create) | Logger required (app passes it; "config from app" pattern)                    |
| `cau-api-server` npm name     | `@util/api-server`                                                            |

---

## 3. Public API

### Class Pattern: Singleton + factory

```typescript
class ApiServer {
  static create(config: ApiServerConfig): ApiServer;
  static getInstance(): ApiServer;
  start(): Promise<void>;
  stop(): Promise<void>;
  get expressApp(): Application;
  get port(): number;
}
```

### ApiServerConfig

- `config?: ServerConfig` -- PORT, API_PREFIX, ALLOWED_ORIGINS, BODY_LIMIT, rate limit settings
- `logger: Logger` -- required @util/logger instance
- `onAppStart?: LifecycleCallback` -- called during `start()`
- `onAppStop?: LifecycleCallback` -- called during `stop()`
- `routes: RouteDefinition[]` -- JSON route definitions (method-aware)

### SSE helper (Express-first)

For real-time endpoints, use `createSseEndpoint()` and mount the returned `handler` in Express. Keep the returned `publish()` function in module scope so application services can emit events from anywhere.

```typescript
const events = createSseEndpoint({
  openApi: { path: "/events/users", summary: "User events" },
  onConnect: ({ send }) => send({ event: "connected", data: { ok: true } }),
});

router.get("/events/users", events.handler);

// anywhere:
events.publish({ event: "user.updated", data: { id: "123" } });
```

---

## 4. Security Middleware (auto-applied)

| Package               | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| helmet                | Security HTTP headers                          |
| cors                  | Cross-Origin Resource Sharing                  |
| compression           | Gzip response compression                      |
| express-rate-limit    | Brute-force / DDoS protection                  |
| express.json          | JSON body parser with size limit               |
| request-id (built-in) | Auto `X-Request-Id` + child logger per request |

---

## 5. Problem Definition

Express apps require extensive boilerplate for security, error handling, CORS, rate limiting, graceful shutdown, and structured responses. Each new service repeats this setup, leading to drift and inconsistency. `@util/api-server` eliminates this by wrapping Express behind a single `create()` call that wires everything automatically.

---

## 6. Requirements

| #   | Requirement                              | Status |
| --- | ---------------------------------------- | ------ |
| R1  | Single factory call configures full app  | Done   |
| R2  | POST-only routes with `{ data, error }`  | Done   |
| R3  | Helmet, CORS, rate limit, compression    | Done   |
| R4  | Graceful shutdown on SIGTERM/SIGINT      | Done   |
| R5  | Request ID injection per request         | Done   |
| R6  | Health endpoint at `GET /health`         | Done   |
| R7  | Swagger docs (opt-in)                    | Done   |
| R8  | Idempotent start/stop guards             | Done   |
| R9  | Listen timeout with error event handling | Done   |
| R10 | Non-POST methods supported               | Done   |
| R11 | SSE helper with publish-anywhere         | Done   |
| R12 | Versioned routing (required per-route)   | Done   |

---

## 7. Phases

| Phase | Description                                      | Status    |
| ----- | ------------------------------------------------ | --------- |
| 1     | Port from cau-api-server, adapt to Nexus layout  | Completed |
| 2     | Security middleware + request ID + health        | Completed |
| 3     | Swagger opt-in support                           | Completed |
| 4     | Idempotent lifecycle + listen timeout            | Completed |
| 5     | Full test coverage (lifecycle, rate limit, CORS) | Completed |

---

## 8. Test Plan

### ApiServer (singleton + lifecycle)

- `create()` returns instance with `expressApp` accessible
- `getInstance()` returns same instance after `create()`
- `getInstance()` throws before `create()`
- `stop()` calls `onAppStop` callback
- `start()` calls `onAppStart` callback
- `stop()` then `create()` reinitializes cleanly (singleton reset)

### Routes + error handling

- Method-aware versioned routes under `API_PREFIX/{version}` return `{ data, error }` envelope
- Routes from different versions mount under separate prefixes
- Handler receives `input` and `RouteContext` with `requestId`
- Handler errors return 500 with error message
- Unknown routes return 404

### SSE helper

- `createSseEndpoint()` returns `{ handler, publish, closeAll }`
- `handler` responds with `text/event-stream` and keeps the connection open
- `publish()` broadcasts events to all connected clients for that endpoint

### Security

- `X-Request-Id` header included in responses
- Rate limiting enforced after threshold exceeded
- CORS headers present when `allowedOrigins` configured

### Built-in endpoints

- `GET /health` returns `{ data: { status, uptime }, error: null }`

---

## 9. Decision Log

| #   | Question                    | Decision                                                      | Date       |
| --- | --------------------------- | ------------------------------------------------------------- | ---------- |
| 1   | Express 5 vs 4              | Express 5 -- stable, native async error handling              | --         |
| 2   | Logger optional vs required | Required -- app creates and passes it (Nexus convention)      | --         |
| 3   | Test runner                 | Jest (Nexus standard)                                         | --         |
| 4   | Config loading              | No dotenv; defaults in constants, overrides via config object | --         |
| 5   | Middleware extension        | `server.expressApp.use()` only                                | --         |
| 6   | Health endpoint             | Built-in `GET /health` at root, always registered             | --         |
| 7   | Idempotent lifecycle        | `#running` flag guards `start()`/`stop()` against misuse      | 2026-03-17 |
| 8   | Listen timeout              | `server.once("error")` + `LISTEN_TIMEOUT_MS` safety net       | 2026-03-17 |
| 9   | Rate limit architecture     | Use `@util/rate-limit-core` adapter path with optional stores | 2026-03-24 |
