# Review — @util/agentic-memory

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `saveMemory` constructs `entry` with `documentVersion: 0` and passes it to `beforeSave`; the hook sees a stale value because `$inc` in the adapter overwrites it on every upsert — `src/agentic-memory.ts:83` — [logic]
- [ ] [med] `beforeSave` hook result is used as `this.#hooks.beforeSave?.(entry) ?? entry`; if the hook returns `undefined` (e.g. due to a missing `return` statement) the original unmodified entry silently passes through — `src/agentic-memory.ts:91` — [logic]
- [ ] [low] `decideCommit` casts `match?.payloadJson.mode` to `CommitPolicyMode` without validating the value is a known enum member; an invalid stored value silently defaults to `AUTO` — `src/policy/commit-policy.ts:55` — [logic]
- [ ] [low] No test for `retrieveMemory` with an empty `types` array to confirm the type filter is not applied — `src/agentic-memory.test.ts` — [test-coverage]
- [ ] [low] No test for `saveMemory` TTL path (`ttlMs > 0`) verifying `expiresAtMs` is computed correctly — `src/agentic-memory.test.ts` — [test-coverage]
- [ ] [low] No test covering `beforeSave`, `afterSave`, `beforeRetrieve`, or `afterRetrieve` hooks — `src/agentic-memory.test.ts` — [test-coverage]
- [ ] [low] `MongoMemoryStoreAdapter` constructor calls `MongoDb.create()` and immediately reads the singleton; if `MongoDb.create()` or a subsequent call throws after the singleton is written, the Mongo singleton is leaked and never cleaned up — `src/adapters/mongo-memory-store.adapter.ts:95-103` — [resource]
- [ ] [low] `MemoryToolValidationError` exposes `zodError: ZodError` as a public field, leaking a library-internal type (`ZodError` from `zod`) past `index.ts` — `src/errors.ts:27` — [api]

## Completed

- [x] Initial package scaffold and Mongo-default memory implementation — resolved pre-2026-03-29
- [x] [high] Retrieve `query` regex injection / ReDoS — escape literals, cap length — `src/adapters/mongo-memory-store.adapter.ts`, `src/helpers/escape-regex-literal.util.ts`, `src/constants.ts` — resolved 2026-03-29
- [x] [high] Index init permanent failure — reset `#indexInitPromise` on error — `src/adapters/mongo-memory-store.adapter.ts` — resolved 2026-03-29
- [x] [high] Mongo singleton overwrite — `MongoDb.tryGetInstance` + `getConfig`, conflict error — `packages/util-mongodb/src/mongo-db.ts`, `src/adapters/mongo-memory-store.adapter.ts` — resolved 2026-03-29
- [x] [med] Shared `MongoDb.close()` — `closeConnectionOnClose` (default false) — `src/types.ts`, `src/adapters/mongo-memory-store.adapter.ts` — resolved 2026-03-29
- [x] [med] Test gaps — delete, ranking, tool validation, singleton conflict, close — `src/agentic-memory.test.ts` — resolved 2026-03-29
- [x] [med] Raw ZodError from tools — `MemoryToolValidationError` + `safeParse` — `src/errors.ts`, `src/tools/memory-tools.ts` — resolved 2026-03-29
- [x] [low] SKILL.md Rules — `SKILL.md` — resolved 2026-03-29
- [x] [low] README config table — `README.md` — resolved 2026-03-29
- [x] [low] Magic numbers / recency constant — `src/constants.ts`, `src/adapters/mongo-memory-store.adapter.ts`, `src/helpers/compute-memory-score.util.ts` — resolved 2026-03-29
- [x] [low] Tool return types — `src/tools/memory-tools.ts` — resolved 2026-03-29
