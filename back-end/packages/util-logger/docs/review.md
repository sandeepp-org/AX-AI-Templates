# Review — @util/logger

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `buildRedactFormat` mutates the `info` object in-place (`obj[last] = REDACTED_VALUE`) rather than producing a new object; if downstream transports or format combiners hold a reference to the same object they see already-redacted data — `src/helpers/build-redact-format.util.ts:27` — [logic]
- [ ] [med] `buildRedactFormat` does not handle the case where an intermediate key resolves to a non-object (e.g. `null`, a string, or an array); the `isTraversable` check correctly skips arrays but silently stops traversal without signaling a misconfigured path — `src/helpers/build-redact-format.util.ts:19` — [logic]
- [ ] [low] `Logger.close()` waits for the `"finish"` event on the underlying winston instance but does not set a timeout; if a transport never flushes (e.g. a hanging MongoDB connection), the promise hangs forever — `src/logger.ts:145` — [resource]
- [ ] [low] `createMongodbTransport` uses `require("winston-mongodb")` inside a `try/catch` at module load time, relying on the side-effect of patching `winston.transports`; if the optional dependency is missing and the MONGODB transport type is requested, the downstream error is a confusing `TypeError: MongoDB is not a constructor` rather than a clear "missing peer dependency" message — `src/transports/mongodb.transport.ts:6` — [logic]
- [ ] [low] No test for the `"silent"` log level suppressing all output — `src/logger.test.ts` — [test-coverage]
- [ ] [low] No test for `Logger.close()` clearing the singleton reference (`Logger.getInstance()` should throw after `close()`) — `src/logger.test.ts` — [test-coverage]
- [ ] [low] `buildTransports` is `async` only because of the dynamic `import()` for the MongoDB transport; all other branches are synchronous. The function signature leaks this implementation detail to callers — `src/helpers/build-transports.util.ts:7` — [design]

## Completed

### Test deepening (latest)

- [x] [med] `logger.test.ts` rewritten — 21 tests now verify actual output content (JSON structure, level field, metadata spread), not just "doesn't throw"
- [x] [med] Log level filtering tests added — verify messages below configured level are suppressed, level setter takes effect, trace-only and fatal-all behavior
- [x] [med] Child logger tests deepened — bindings appear in output, nested children accumulate bindings, child inherits parent level filtering, parent doesn't inherit child bindings
- [x] [med] `defaultMeta` tests deepened — verify fields appear in every log entry and merge with per-message metadata
- [x] [med] Redaction tests deepened — verify redacted fields show `[Redacted]` in output, non-redacted fields untouched
- [x] [med] `console.transport.test.ts` deepened — verifies simple format output content, JSON parseable output with metadata, transport-level filtering, default format
- [x] [med] `build-transports.util.test.ts` deepened — verifies transport instance types (Console vs MongoDB), level option applied, mixed transport ordering
- [x] [med] `mongodb.transport.integration.test.ts` rewritten — 4 tests verify logs actually persist to real MongoDB: message+level, metadata fields, multiple logs, timestamp

### Prior fixes

- [x] [med] Redact logic extracted from `create()` into `buildRedactFormat` helper — `src/helpers/build-redact-format.util.ts`
- [x] [med] `close()` fixed — replaced no-op `await Promise.resolve()` with `winston.end()` + `finish` event — `src/logger.ts`
- [x] [low] TODO comment removed, `create()` refactored — `src/logger.ts`
- [x] [low] `docs/plan.md` old names and missing sections fixed — `docs/plan.md`
- [x] [low] winston-mongodb transport custom-level caveat documented — JSDoc in mongodb.transport.ts, README MongoDB section — resolved 2026-03-23
