# Review — @util/jwt-tokens

Last reviewed: 2026-04-06

## Open Issues

- [ ] [med] `hashPassword` and `verifyPassword` accept an empty string (`""`) as valid input — no guard prevents hashing an empty password, which would allow accounts with blank passwords to be created — `src/helpers/hash-password.util.ts:5` — [logic]
- [ ] [med] `rotateTokens` silently defaults `role` to `"user"` when the refresh token payload omits `role` (`payload.role ?? "user"`); a revoked or stripped-role token would produce an access token with an incorrect promotion to the default role — `src/helpers/rotate-tokens.util.ts:22` — [logic]
- [ ] [low] No test for `hashPassword` with an empty string input — `src/helpers/hash-password.util.test.ts` — [test-coverage]
- [ ] [low] No test for `verifyPassword` when `hash` is an empty or malformed string — `src/helpers/hash-password.util.test.ts` — [test-coverage]
- [ ] [low] No test for `signAccessToken` and `signRefreshToken` with unsupported `algorithm` values — `src/helpers/sign-token.util.test.ts` — [test-coverage]
- [ ] [low] `JwtTokens` class duplicates every static method as an instance method by direct assignment (`this.hashPassword = hashPassword`); this is redundant and increases the class surface area without benefit — `src/jwt-tokens.ts:26-38` — [design]
- [ ] [low] `JwtTokens` has a `private constructor` but provides no factory method — callers can never instantiate it via `new`; the class only serves as a namespace for static helpers and could simply be a namespace object or module export — `src/jwt-tokens.ts:24` — [design]

## Completed

- [x] Package name `@util/jwt-tokens` follows org prefix convention — `package.json` — resolved 2026-03-23
- [x] All types declared in `types.ts`; no library types exposed in public signatures — `src/types.ts` — resolved 2026-03-23
- [x] `index.ts` exports only public API (class + types) — `src/index.ts` — resolved 2026-03-23
- [x] No env loading in package; secrets passed as parameters — `src/**` — resolved 2026-03-23
- [x] `docs/plan.md` has Problem Definition, Requirements, Architecture, Phases, Test Plan, Decision Log — `docs/plan.md` — resolved 2026-03-23
- [x] `docs/future-roadmap.md` present and populated — `docs/future-roadmap.md` — resolved 2026-03-23
- [x] All helpers are standalone arrow functions; `JwtTokens` class delegates entirely — `src/jwt-tokens.ts` — resolved 2026-03-23
- [x] Zero mocking in all test files; real execution throughout — `src/**/*.test.ts` — resolved 2026-03-23
- [x] `package.json` has all required scripts: build, test, typecheck, clean — `package.json` — resolved 2026-03-23
- [x] [med] Missing test for expired token — added to sign-token.util.test.ts — resolved 2026-03-23
- [x] [med] Missing test for access token with missing sub or role — added verify-token.util.test.ts — resolved 2026-03-23
- [x] [med] DecodedPayload exported from index.ts — added to types.ts and index — resolved 2026-03-23
- [x] [low] toSecretKey extracted to to-secret-key.util.ts — resolved 2026-03-23
- [x] [low] DecodedPayload moved to types.ts — resolved 2026-03-23
- [x] [low] Function comments added to all helpers — resolved 2026-03-23
- [x] [low] Regex literals extracted to REGEX_LOWERCASE, REGEX_UPPERCASE, REGEX_DIGIT — resolved 2026-03-23
- [x] [low] validatePasswordStrength test asserts valid:false and issues — resolved 2026-03-23
- [x] [low] hashPassword test with custom memoryCost/timeCost — resolved 2026-03-23
- [x] [low] validatePasswordStrength empty string test — resolved 2026-03-23
- [x] [low] extractTokenId test for JWT without jti — resolved 2026-03-23
- [x] [low] decodeToken null for invalid token test — resolved 2026-03-23
- [x] [low] rotateTokens test with custom options — resolved 2026-03-23
- [x] [low] SKILL.md Rules section — resolved 2026-03-23
- [x] [low] README pnpm clean script — resolved 2026-03-23
