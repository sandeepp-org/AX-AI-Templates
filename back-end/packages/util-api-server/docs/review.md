# Review — @util/api-server

Last reviewed: 2026-04-06

## Open Issues

- [ ] [high] `create-rate-limit-middleware.util.ts` has no unit test file — store-throw path (`next(err)`), response headers on allowed/denied, 429 body format, and `req.ip` fallback are all untested directly — `src/helpers/create-rate-limit-middleware.util.ts` — [test-coverage]
- [ ] [med] No integration test for identity resolver config (`RATE_LIMIT_GET_ORG_ID`, `RATE_LIMIT_GET_USER_ID`, `RATE_LIMIT_GET_API_KEY_ID`) — new public config fields with zero test coverage — `src/api-server.test.ts` — [test-coverage]
- [ ] [med] `setup-security.util.ts` fallback (`options?.rateLimitCore ?? new RateLimitCore()`) creates an isolated store if caller omits `rateLimitCore`; diverges from the shared core passed by `ApiServer.create` — `src/helpers/setup-security.util.ts:41` — [logic]
- [ ] [med] `replayMissedEvents` errors are silently swallowed — the `.catch` branch calls `onConnect(ctx)` as if nothing went wrong, giving callers no signal that replay failed; store errors should be logged or re-thrown — `src/helpers/create-sse-endpoint.util.ts:334-339` — [logic]
- [ ] [med] `publish()` broadcasts to all active connections but fires-and-forgets `store.appendEvent`; if the store write fails the event is still sent to connected clients but absent from history — race condition for new clients who reconnect — `src/helpers/create-sse-endpoint.util.ts:286-290` — [logic]
- [ ] [med] `SSE_DOCS` in `sse-openapi-registry.util.ts` is module-level mutable state; calling `registerSseDoc` from multiple `createSseEndpoint` calls (e.g. across tests) accumulates entries across test runs without isolation — `src/helpers/sse-openapi-registry.util.ts:5` — [design]
- [ ] [med] `shutdownStarted` in `setup-signals.util.ts` is a module-level mutable boolean; multiple `ApiServer` instances in the same process (or in tests) share this flag, meaning the first shutdown permanently prevents subsequent graceful shutdowns — `src/helpers/setup-signals.util.ts:6` — [design]
- [ ] [low] `Retry-After` header not sent on 429 response — RFC 6585 §4 requires it alongside `x-ratelimit-reset` — `src/helpers/create-rate-limit-middleware.util.ts:65` — [api]
- [ ] [low] `rateLimitCore` not included in `setup-security.util.ts` destructuring block; accessed via `options?.rateLimitCore` on a separate line while every other option is destructured — `src/helpers/setup-security.util.ts:35` — [style]
- [ ] [low] `SseSessionRegistry` and related session types (`SseSession`, `SseSessionIdentity`) are exported from `types.ts` but not re-exported from `index.ts`; callers cannot type session registry implementations — `src/index.ts` — [api]
- [ ] [low] `start()` sets `this.#running = true` before `onAppStart()` resolves; if `onAppStart` throws, the server is marked running but never actually listening — `src/api-server.ts:261` — [logic]
- [ ] [low] No test for concurrent `start()` calls throwing the "already running" error — `src/api-server.test.ts` — [test-coverage]

## Completed

- [x] [high] SSE registry singleton — `publish/send` now check `isWritable(res)` guard; `teardownConnection` is idempotent via `closed` flag; duplicated `SseConnectionContext` type removed — `src/helpers/create-sse-endpoint.util.ts`
- [x] [high] `publish()` and `send()` write-after-end — added `isWritable()` check before every `res.write` — `src/helpers/create-sse-endpoint.util.ts`
- [x] [high] Double-close guard — extracted `teardownConnection` with `connection.closed` flag; both `close()` and `req.on("close")` route through it — `src/helpers/create-sse-endpoint.util.ts`
- [x] [med] Duplicated `SseConnectionContext` type removed from `create-sse-endpoint.util.ts`; now imports from `types.ts` — `src/helpers/create-sse-endpoint.util.ts`
- [x] [med] Fragile `router as unknown as Record` replaced with type-safe `SUPPORTED_METHODS` check + `router[method]()` — `src/helpers/register-routes.util.ts`
- [x] ~~[med] `serialize-error.util.ts` dead code~~ — false positive; still used by `setup-signals.util.ts`; added function comments — `src/helpers/serialize-error.util.ts`
- [x] [med] Added tests for PUT, PATCH, DELETE routes — `src/helpers/register-routes.util.test.ts`
- [x] [med] Added test for `closeAll()` ending client streams — `src/helpers/create-sse-endpoint.util.test.ts`
- [x] [med] Added test for `onConnect` callback contract (send, close, abortSignal, requestId, logger) — `src/helpers/create-sse-endpoint.util.test.ts`
- [x] [med] Added test for heartbeat delivery — `src/helpers/create-sse-endpoint.util.test.ts`
- [x] [med] Client disconnect abort covered by `closeAll` test (triggers `teardownConnection` → abort) — `src/helpers/create-sse-endpoint.util.test.ts`
- [x] [low] `buildJsonRoutePathItem` refactored to single-return via computed property — `src/helpers/setup-swagger.util.ts`
- [x] [low] `HTTP_METHODS` re-exported from `index.ts` — `src/index.ts`
- [x] [low] `SseEndpoint.handler` now uses local `SseRequestHandler` type instead of inline `import("express")` — `src/types.ts`
- [x] [low] SKILL.md updated to reflect method-aware routing and SSE — `SKILL.md`
- [x] [low] README Quick Start updated to show `method` field — `README.md`
- [x] ~~[low] `setupSecurity` missing `@param` docs~~ — false positive; function comment already present; code-style rules don't require JSDoc params
- [x] [low] Added function comments to `serializeError` and `formatNonErrorMessage` — `src/helpers/serialize-error.util.ts`
- [x] [low] Added function comment to `readStreamUntil` test helper — `src/helpers/create-sse-endpoint.util.test.ts`
- [x] [med] `app.listen()` timeout — added `server.once("error")` rejection, `LISTEN_TIMEOUT_MS` safety net, and `#running` reset on failure — `src/api-server.ts:216-235`
- [x] [med] `stop()` called without `start()` — idempotent stop guard added (`#running` flag, early return) — `src/api-server.ts:247-250`
- [x] [med] `create()` after `stop()` reinitializes cleanly — test added — `src/api-server.test.ts`
- [x] [low] Rate limiting enforced after threshold — test added — `src/api-server.test.ts`
- [x] [low] CORS headers present when `allowedOrigins` configured — test added — `src/api-server.test.ts`
- [x] [low] `docs/plan.md` old name `@utils/api-server` — renamed to `@util/api-server` across 5 occurrences — `docs/plan.md`
- [x] [low] `docs/plan.md` missing sections — added Problem Definition, Requirements, Phases, Test Plan, Decision Log — `docs/plan.md`
- [x] ~~[low] Imports `@util/error-normalizer` naming inconsistency~~ — false positive, import matches `package.json` dependency name
