# @util/jwt-tokens Design Plan

## Problem Definition

The Nexus monorepo needs a focused utility package for JWT lifecycle, password hashing, and role-based access control primitives. This package does not orchestrate OAuth providers or identity linking; it provides building blocks for token-based auth.

## Requirements

1. Pure functions where possible — no storage, no framework coupling in core logic.
2. JWT sign/verify using jose (ESM, Web Crypto).
3. Password hashing with argon2.
4. Token rotation (refresh → new access + refresh pair).
5. Role-based middleware for Express with configurable token extraction and revocation check.
6. Extensible for future auth-orchestrator package (Google/Microsoft/GitHub).

## Architecture

- **Main class:** JwtTokens (static-only) — delegates to helpers.
- **Helpers:** hash-password, validate-email, validate-password-strength, sign-token, verify-token, extract-token-id, decode-token, rotate-tokens.
- **Middleware:** Not included — consumers build Express (or other) middleware using JwtTokens.verifyAccessToken, extractTokenId, etc.
- **Dependencies:** argon2, jose only. No Express or framework deps.

## Phases

| Phase          | Goal       | Deliverables                                          |
| -------------- | ---------- | ----------------------------------------------------- |
| 1 — Foundation | Scaffold   | package.json, tsconfig, types, constants, index, docs |
| 2 — Core       | Build      | All helpers, JwtTokens class, requireRoles middleware |
| 3 — Tests      | Verify     | Helper tests, middleware tests, zero mocks            |
| 4 — Docs       | Ship-ready | README, SKILL, plan finalized                         |

## Test Plan

### hashPassword / verifyPassword

- hashPassword → verifyPassword roundtrip succeeds
- verifyPassword with wrong password returns false
- verifyPassword with invalid hash throws

### validateEmail

- Valid email returns { valid: true }
- Invalid format returns { valid: false, error }
- Empty string returns { valid: false }

### validatePasswordStrength

- Strong password returns valid
- Short password returns issues
- Missing digit/upper/lower returns issues

### signAccessToken / signRefreshToken / verifyAccessToken / verifyRefreshToken

- Sign and verify roundtrip succeeds
- Expired token verification throws
- Invalid secret throws
- Missing sub/role in access token throws

### extractTokenId / decodeToken

- extractTokenId returns jti from valid token
- extractTokenId returns null for invalid token
- decodeToken returns payload without verifying

### rotateTokens

- Valid refresh token → new access + refresh pair
- Invalid/expired refresh token throws

## Decision Log

| #   | Decision                     | Rationale                                          |
| --- | ---------------------------- | -------------------------------------------------- |
| 1   | Use jose for JWT             | ESM-native, Web Crypto, no Node callback legacy    |
| 2   | Use argon2 for passwords     | OWASP-recommended, modern                          |
| 3   | Single role in token payload | Simpler RBAC for endpoint gating                   |
| 4   | Express as optional peer     | Middleware is optional; core works without Express |
