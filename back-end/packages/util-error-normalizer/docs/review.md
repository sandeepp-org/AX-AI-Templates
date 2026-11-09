# Review — @util/error-normalizer

Last reviewed: 2026-04-06

## Open Issues

- [ ] [low] `BaseAppError` constructor does not call `Object.setPrototypeOf(this, new.target.prototype)` — unlike `MongoDbValidationError` and `MongoDbConflictError`, the subclasses `ValidationError`, `NotFoundError`, etc. may fail `instanceof` checks when the code is transpiled to ES5 — `src/errors.ts:5` — [logic]
- [ ] [low] `resolveErrorShape` reassigns `result` inside a chain of `if/else` blocks rather than returning early from each branch; this pattern uses a mutable binding where individual `return` statements would be clearer — `src/helpers/normalize-error.util.ts:26` — [style]
- [ ] [low] No test for a thrown plain object (no `message` field) to verify `DEFAULT_ERROR_MESSAGE` is used and the object becomes `details` — `src/helpers/normalize-error.util.test.ts` — [test-coverage]
- [ ] [low] No test for a thrown `number` primitive to confirm `String(error)` is used as the message — `src/helpers/normalize-error.util.test.ts` — [test-coverage]

## Completed

- [x] [med] `normalizeError` with `null` input — test added — `src/helpers/normalize-error.util.test.ts`
- [x] [med] `normalizeError` with `undefined` input — test added — `src/helpers/normalize-error.util.test.ts`
- [x] ~~[med] `isAppError()` type guard~~ — false positive, already tested at `normalize-error.util.test.ts:55-71`
- [x] [low] `normalizeError` with `mapDetails` option — test added — `src/helpers/normalize-error.util.test.ts`
- [x] ~~[low] `normalizeError` with `includeStack: true`~~ — false positive, already tested at `normalize-error.util.test.ts:46-52`
- [x] ~~[low] `normalizeError` with `traceId` option~~ — false positive, already tested at `normalize-error.util.test.ts:9,15`
- [x] [low] `docs/plan.md` old name `@utils/errors` — renamed to `@util/error-normalizer` across 7 occurrences — `docs/plan.md`
- [x] [low] `docs/plan.md` missing sections — added Problem Definition, Requirements, Phases, Test Plan, Decision Log — `docs/plan.md`
