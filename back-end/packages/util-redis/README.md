# @util/redis

Redis-backed TTL record storage with generic helpers.

## Install

```bash
pnpm add @util/redis
```

## Quick Start

```typescript
import { Redis, RecordStore } from "@util/redis";

Redis.create({ url: process.env.REDIS_URL! });

await RecordStore.setRecord({
  key: "user-123:refresh-abc",
  record: { value: { sessionId: "s1" } },
  ttlMs: 60_000,
});

const record = await RecordStore.getRecord("user-123:refresh-abc");
await RecordStore.revokeRecord("user-123:refresh-abc");
```

## Infrastructure setup

This package assumes a running Redis instance; it only consumes a connection URL and optional tuning options.

- **Local development:**
  - Run Redis via Docker:
    ```bash
    docker run -d --name nexus-redis-dev -p 6379:6379 redis:7
    ```
  - Typical env wiring in the app:
    ```bash
    export REDIS_URL="redis://localhost:6379"
    ```
  - In the app bootstrap:

    ```typescript
    import { Redis } from "@util/redis";

    Redis.create({ url: process.env.REDIS_URL! });
    ```

- **CI / ephemeral environments:**
  - Use the same Docker invocation or a managed test Redis.
  - Point `REDIS_URL` at the test instance.
- **Production (examples):**
  - Use a managed Redis offering (AWS ElastiCache, Azure Cache for Redis, etc.).
  - Inject the managed endpoint as `REDIS_URL` via your deployment environment.

For production credentials or TLS configuration, keep secrets in a secret manager (for example `@util/secret-manager-aws`) and assemble the `url` (or client options) in the app before calling `Redis.create`.

## API

### `Redis`

Singleton lifecycle:

- `Redis.create(config)`
- `Redis.getInstance()`
- `Redis.close()`

### `RecordStore`

- `RecordStore.setRecord({ key, record, ttlMs })`
- `RecordStore.getRecord(key)`
- `RecordStore.revokeRecord(key)`
- `RecordStore.revokeByPrefix({ keyPrefix })`

## Configuration

**RedisConfig:**

| Field                | Type     | Default      | Description                                                           |
| -------------------- | -------- | ------------ | --------------------------------------------------------------------- |
| `url`                | `string` | --           | Redis connection string, e.g. `redis://localhost:6379`.               |
| `keyPrefix`          | `string` | `"nexus"`    | Prefix applied to all keys created by this package.                   |
| `recordNamespace`    | `string` | `"records"`  | Logical record namespace (keeps different record families separated). |
| `defaultRecordTtlMs` | `number` | `86_400_000` | Default TTL in milliseconds (stored for future defaults).             |
| `maxRetryAttempts`   | `number` | `3`          | Max retries for Redis operations (wrapped by `withOperation()`).      |
| `baseRetryDelayMs`   | `number` | `100`        | Base delay (ms) for retry backoff.                                    |

## Package Structure

```text
packages/util-redis/
  docs/
  src/
  test.env
  tsconfig.json
  package.json
  SKILL.md
  README.md
```
