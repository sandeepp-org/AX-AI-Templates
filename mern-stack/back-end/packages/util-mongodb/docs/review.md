# Review — @util/mongodb

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `findOne` logs `filter` at `debug` level — `src/operations/read.ts:26` — filters commonly contain user-supplied values (email, id) or sensitive fields; logging them to structured output risks leaking PII or credentials into log sinks — [security]
- [ ] [med] `updateOne`, `updateMany`, and `findOneAndUpdate` log `filter` at `debug` level for the same reason — `src/operations/update.ts:71`, `src/operations/update.ts:128`, `src/operations/update.ts:186` — [security]
- [ ] [med] `countDocuments` and `distinct` also log `filter` at debug — `src/operations/read.ts:120`, `src/operations/read.ts:152` — [security]
- [ ] [med] `createMany` passes `params.docs` directly to `validateManyWithSchema` even when validation fails for some items; `validateManyWithSchema` collects all issues and throws a single error, but partially-valid docs are silently dropped before the throw — callers cannot distinguish which indices failed — `src/helpers/validate-params.util.ts:36` — [logic]
- [ ] [low] `buildDefaultLogger` returns `{} as unknown as Logger` via a no-op shape; `child()` recursively calls `buildDefaultLogger()` which works, but calling `close()` on a default logger returns `Promise.resolve()` without awaiting anything — acceptable but inconsistent with `Logger.close()` semantics — `src/mongo-db.ts:62` — [design]
- [ ] [low] `withTransaction` uses `as never` cast to pass `{ maxTimeMS }` to `session.commitTransaction()`; this bypasses TypeScript type safety for the commit options — `src/mongo-db.ts:193` — [style]
- [ ] [low] No test for `createMany` with an empty array input — `src/operations/crud.test.ts` — [test-coverage]
- [ ] [low] No test for `withTransaction` rollback path (operation throws, abort should be called) — `src/operations/crud.test.ts` — [test-coverage]
- [ ] [low] `MongoDbContract` interface exposes `collection(name: string): Collection` — this leaks the native `mongodb.Collection` type in the public interface, violating the API surface rule — `src/interfaces.ts:7` — [api]

## Completed

- [x] [med] Full CRUD integration tests added (23 tests) — `createOne`, `createMany`, `findOne`, `findMany`, `countDocuments`, `distinct`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, `findOneAndDelete`, `aggregate` — `src/operations/crud.test.ts`
- [x] [med] Zod validation tests — schema pass, schema fail (`MongoDbValidationError`) — `src/operations/crud.test.ts`
- [x] [med] Optimistic concurrency tests — `MongoDbConflictError` on stale `updatedAt` for `updateOne` and `findOneAndUpdate` — `src/operations/crud.test.ts`
- [x] [med] Soft-delete verification — confirms soft-deleted docs excluded from `findOne`, `findMany`, `aggregate`, `distinct` — `src/operations/crud.test.ts`
- [x] [med] Test added: `collection()` called before `connect()` throws expected error — `src/operations/connect.test.ts`
- [x] [med] Test added: singleton lifecycle reinit after `close()` + `create()` — `src/operations/connect.test.ts`
- [x] [low] `docs/plan.md` renamed `@utils/mongodb` to `@util/mongodb`, `utils-mongodb` to `util-mongodb` — `docs/plan.md`
- [x] [low] `docs/plan.md` added Problem Definition, Phases, Test Plan, Decision Log — `docs/plan.md`
- [x] [low] Added unreachable-server connection failure test asserting connection error shape — `src/operations/connect.test.ts` — resolved 2026-03-23
- [x] [low] Concurrent connect() guard added — `connectPromise` prevents multiple connections; test added — `src/operations/connect.ts`, `src/operations/connect.test.ts` — resolved 2026-03-23
