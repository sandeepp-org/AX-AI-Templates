# Review — @util/secret-manager-aws

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `AwsSecretManager.create` is documented as equivalent to `createInstance`, but `create` simply calls `createInstance` — the two static methods have identical JSDoc comments, which is misleading and creates unnecessary surface area — `src/aws-secret-manager.ts:28-44` — [design]
- [ ] [med] `#listSecretNames` paginates through all secrets in the account when `getSecrets()` is called with no arguments; this can produce thousands of API calls against large AWS accounts, with no configurable page limit or timeout — `src/aws-secret-manager.ts:113` — [resource]
- [ ] [med] `getSecrets()` fetches all secrets in parallel via `Promise.all`; for large accounts this can hit AWS API rate limits, causing throttling errors for the entire batch — no batching or concurrency cap is applied — `src/aws-secret-manager.ts:67` — [logic]
- [ ] [low] `close()` calls `this.#client.destroy()` but does not `await` it — the AWS SDK's `destroy()` is synchronous in some versions but async in others; wrapping it in a `try/catch` or awaiting a no-op `Promise.resolve()` around it would be safer — `src/aws-secret-manager.ts:163` — [resource]
- [ ] [low] No test that verifies `close()` sets the singleton to null so that `getInstance()` throws after `close()` — current test only checks that a fresh instance can be created — `src/aws-secret-manager.test.ts` — [test-coverage]
- [ ] [low] No test for `getSecrets()` called with an explicit empty array (`[]`) — current code falls through to listing all secrets, which may be surprising — `src/aws-secret-manager.test.ts` — [test-coverage]
- [ ] [low] `DEFAULT_REGION` constant is not exported from `index.ts`; callers cannot discover the default region without reading the source — `src/constants.ts` — [api]

## Completed

- [x] [high] `#getSecretValue` no longer silently swallows all errors — only `ResourceNotFoundException` returns null, all other errors propagate — `src/aws-secret-manager.ts`
- [x] [med] `getSecrets()` now fetches secrets in parallel via `Promise.all` instead of sequential `for...of` — `src/aws-secret-manager.ts`
- [x] [med] Test added: reinit after `close()` + `createInstance()` produces clean new instance — `src/aws-secret-manager.test.ts`
- [x] [med] Test added: `getSecrets` with fake credentials propagates non-ResourceNotFoundException errors — `src/aws-secret-manager.test.ts`
- [x] [low] Test added: `setSecret` with fake credentials propagates errors — `src/aws-secret-manager.test.ts`
- [x] [low] `docs/plan.md` renamed `@utils/secret-manager-aws` to `@util/secret-manager-aws` — `docs/plan.md`
- [x] [low] `docs/plan.md` added Problem Definition, Requirements, Phases, Test Plan, Decision Log — `docs/plan.md`
- [x] [med] Added `AwsSecretManager.create()` alias for `createInstance()` to match other packages' factory naming — resolved 2026-03-23
- [x] [low] Added opt-in integration test for `getSecrets()` against real AWS Secrets Manager when credentials are present (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) — `src/aws-secret-manager.test.ts` — resolved 2026-03-24
- [x] [low] Added opt-in integration test for `setSecret()` create-or-update flow against real AWS Secrets Manager when credentials are present — `src/aws-secret-manager.test.ts` — resolved 2026-03-24
