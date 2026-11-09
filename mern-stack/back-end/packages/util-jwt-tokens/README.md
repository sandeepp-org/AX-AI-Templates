# @util/jwt-tokens

JWT sign/verify, password hashing, token rotation, and role-based access middleware primitives for Nexus apps.

## Install

```bash
pnpm add @util/jwt-tokens
```

## Quick Start

```typescript
import { JwtTokens } from "@util/jwt-tokens";

const secret = process.env.JWT_SECRET!;

// Password
const hash = await JwtTokens.hashPassword("myPassword123");
const ok = await JwtTokens.verifyPassword("myPassword123", hash);

// Tokens
const accessToken = await JwtTokens.signAccessToken(
  { sub: "user-1", role: "admin" },
  secret
);
const payload = await JwtTokens.verifyAccessToken(accessToken, secret);

// Middleware: create in your app (e.g. Express) using JwtTokens.verifyAccessToken and JwtTokens.extractTokenId
```

## API

| Method                   | Signature                                              | Description                  |
| ------------------------ | ------------------------------------------------------ | ---------------------------- |
| hashPassword             | (plain, options?) => Promise\<string\>                 | Hash password with argon2    |
| verifyPassword           | (plain, hash) => Promise\<boolean\>                    | Verify password against hash |
| validateEmail            | (email) => EmailValidationResult                       | Validate email format        |
| validatePasswordStrength | (password) => PasswordStrengthResult                   | Check password rules         |
| signAccessToken          | (payload, secret, options?) => Promise\<string\>       | Sign access JWT              |
| signRefreshToken         | (payload, secret, options?) => Promise\<string\>       | Sign refresh JWT             |
| verifyAccessToken        | (token, secret) => Promise\<AccessTokenPayload\>       | Verify access token          |
| verifyRefreshToken       | (token, secret) => Promise\<RefreshTokenPayload\>      | Verify refresh token         |
| decodeToken              | (token) => DecodedPayload \| null                      | Decode without verify        |
| rotateTokens             | (oldRefresh, secret, options?) => Promise\<TokenPair\> | Rotate to new pair           |
| extractTokenId           | (token) => string \| null                              | Extract jti                  |
| isTokenRevoked           | (jti, revokedIds) => boolean                           | Check against Set            |

## Config

Secrets (JWT_SECRET, etc.) must be provided by the consumer. No env loading in this package.

## Scripts

- `pnpm build` — compile
- `pnpm test` — run tests
- `pnpm typecheck` — type check
- `pnpm clean` — remove dist
