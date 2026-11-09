---
name: util-jwt-tokens
description: JWT sign/verify, password hashing, token rotation, and role-based access middleware. Use when building token-based auth flows.
metadata:
  version: "0.1.0"
  path: packages/util-jwt-tokens
---

# @util/jwt-tokens

JWT lifecycle primitives and role-based route protection. For full API see [README.md](./README.md).

## When to Use

- Password hashing/verification (argon2)
- JWT access and refresh token sign/verify
- Token rotation
- Pure helpers for building auth middleware (verifyAccessToken, extractTokenId)
- jti extraction for revocation/blacklist

## Rules

- Package does not load env; secrets (JWT_SECRET) passed as parameters.
- All types live in `types.ts`; no jose/argon2 types in public API.
- Helpers are pure functions; JwtTokens class delegates only.
- Zero mocking in tests; real jose/argon2 execution.

## Quick usage

```typescript
import { JwtTokens } from "@util/jwt-tokens";

const secret = process.env.JWT_SECRET!;
await JwtTokens.hashPassword("password");
const payload = await JwtTokens.verifyAccessToken(token, secret);
```
