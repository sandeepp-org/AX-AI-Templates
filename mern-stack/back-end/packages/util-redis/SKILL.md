---
name: util-redis
description: Redis-backed TTL record storage with singleton Redis lifecycle.
metadata:
  author: aatmix
  version: "0.1.0"
  path: packages/util-redis
---

# @util/redis

Redis-backed TTL record storage for Nexus services.

For full API reference see [README.md](./README.md).

## When to Use

Use this package when the user needs:

- A singleton Redis connection lifecycle (`Redis.create()` / `getInstance()` / `close()`)
- Generic record set/get/revoke helpers backed by Redis TTL
- Bulk revocation by key prefix (family revoke)

## Workspace Usage (Nexus monorepo)

```bash
pnpm add @util/redis --filter app
```

## Quick Usage

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

## Rules

- Connection strings must come from environment variables passed via `Redis.create(config)`, never hardcoded in app code.
- Call `Redis.create(config)` before any `RecordStore.*` method.
