# Review — @util/rate-limit-core

Last reviewed: 2026-04-06

## Open Issues

- [ ] [high] `InMemoryRateLimitStore` only evicts buckets lazily via `#cleanupExpiredBuckets`; if `cleanupIntervalMs` is very large or the store is never called again, expired buckets accumulate forever — a long-running server with high-cardinality keys (per-IP, per-user) will exhaust heap — `src/in-memory-rate-limit-store.ts:14` — [resource]
- [ ] [med] `buildDefaultBucketKey` appends `clientKey` twice for the `global` scope — `buildScopedIdentitySegments` returns `[normalizeSegment(clientKey)]` for the global fallback case, and line 70 also unconditionally appends `normalizeSegment(context.clientKey)`; the resulting key is `rate-limit:global:IP:anon:IP` — `src/helpers/build-bucket-key.util.ts:64` — [logic]
- [ ] [med] README Redis integration example uses separate `INCR` + `PEXPIRE` calls (non-atomic); if `PEXPIRE` fails after `INCR` succeeds, the key has no expiry and the affected client is rate-limited permanently — `README.md:49` — [security]
- [ ] [med] Missing tests for: window expiry/reset behavior, `org`/`apiKey`/`route`/`composite` scope bucket keys, and direct `InMemoryRateLimitStore` increment/reset logic — `src/rate-limit-core.test.ts` — [test-coverage]
- [ ] [low] No unit tests for `buildDefaultBucketKey` — scope branching, null identity fallbacks, and `normalizeSegment` with empty string are untested — `src/helpers/build-bucket-key.util.ts` — [test-coverage]
- [ ] [low] README missing formal API/config reference tables for `RateLimitCoreOptions`, `RateLimitPolicy`, `ConsumeInput`, and `RateLimitOutcome` — `README.md` — [docs]
- [ ] [low] SKILL.md has no `## Rules` section — `SKILL.md` — [docs]
- [ ] [low] `RateLimitStore` interface is defined in `types.ts` instead of `interfaces.ts`, inconsistent with other packages in this monorepo — `src/types.ts:43` — [style]
- [ ] [low] `InMemoryRateLimitStore` has no `close()` method and thus no way to clear the cleanup timer if the store is embedded in a long-lived test process — `src/in-memory-rate-limit-store.ts` — [resource]

## Completed

- [x] Initial package scaffold created — 2026-03-24
