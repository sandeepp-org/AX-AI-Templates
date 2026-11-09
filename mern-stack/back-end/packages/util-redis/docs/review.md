# Review — @util/redis

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `RecordStore.setRecord` calls `redis.getClient()` and then immediately calls `redis.withOperation()`; `withOperation` internally calls `#ensureClient()` again, resulting in two redundant client-readiness checks per `setRecord` call — `src/record-store.ts:61-67` — [design]
- [ ] [med] `RecordStore.getRecord` and `consumeRecord` share the same pattern — `getClient()` called outside `withOperation` then the actual command is inside `withOperation`; this means the outer `getClient()` call is wasted (its result `client` is used only inside the callback where a fresh client is re-fetched via `#ensureClient`) — `src/record-store.ts:79-89`, `src/record-store.ts:101-111` — [logic]
- [ ] [med] `revokeByPrefix` uses `scanIterator` without a timeout; a large keyspace or a slow Redis server could keep the loop running indefinitely, blocking the caller — `src/record-store.ts:151` — [resource]
- [ ] [med] `withRetry` swallows the original error type and always re-throws as `RedisOperationError`; callers that catch specific Redis error codes from the underlying client (e.g. connection refused) will no longer see those details — `src/helpers/with-retry.util.ts:37` — [logic]
- [ ] [low] No test for `Redis.connect()` called concurrently (two calls before the first resolves) — the current implementation creates two independent clients, the second overwriting the first, which can leave an orphaned connected client — `src/redis.ts:61` — [test-coverage]
- [ ] [low] No test for `withRetry` exponential back-off delay — specifically that it waits between attempts — `src/helpers/with-retry.util.ts` — [test-coverage]
- [ ] [low] `DEFAULT_RECORD_TTL_SECONDS` in `constants.ts` is declared as `60 * 60 * 24` (seconds) but `defaultRecordTtlMs` in `RedisConfig` stores milliseconds; the merge in `Redis.create` multiplies by 1000 correctly, but the naming mismatch (SECONDS vs Ms) is confusing — `src/constants.ts:3`, `src/redis.ts:32` — [style]

## Completed

- [x] `Redis.getClient()` no longer exposes vendor-specific Redis client types — returns `RedisClientAdapter` instead — resolved 2026-03-23
- [x] `Redis.connect()` now quits/cleans up a newly created client on connect failure — resolved 2026-03-23
- [x] Added `RecordStore` edge-case tests (uninitialized Redis, invalid `ttlMs`, invalid JSON/shape) — resolved 2026-03-23
- [x] Refactored `RecordStore` to extract `serializeRecord()` + `parseRecordOrThrow()` helpers — resolved 2026-03-23
- [x] Updated `README.md` with a `RedisConfig` config reference table + defaults — resolved 2026-03-23
- [x] Updated `docs/plan.md` to use generic "record storage" wording (no token/session framing) — resolved 2026-03-23
- [x] Fixed stale "token scans" comment in `Redis.buildRecordKeyPrefix()` — resolved 2026-03-23
- [x] Renamed exported record type to `StoredRecord` to avoid confusion with TS `Record<K, V>` — resolved 2026-03-23
