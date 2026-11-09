# @util/rate-limit-core skill

Use this package when you need framework-agnostic rate limiting with optional external stores.

## What it provides

- `RateLimitCore` consume API
- `InMemoryRateLimitStore` default store
- `RateLimitStore` interface for Redis, MongoDB, or any custom backend
- deterministic default bucket-key builder

## Integration guidance

- Keep transport concerns (Express/Fastify/Koa request parsing) outside this package.
- Build an adapter that maps request metadata to `RateLimitRequestContext`.
- Pass a custom store only when shared/distributed limits are needed.
