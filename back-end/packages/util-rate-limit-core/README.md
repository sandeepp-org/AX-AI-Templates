# @util/rate-limit-core

Framework-agnostic rate limiting engine with pluggable stores.

## Install

```bash
pnpm add @util/rate-limit-core
```

## Quick Start (Default In-Memory)

```typescript
import { RateLimitCore, RATE_LIMIT_SCOPES } from "@util/rate-limit-core";

const core = new RateLimitCore();

const result = await core.consume({
  policy: { windowMs: 60_000, max: 100 },
  scope: RATE_LIMIT_SCOPES.GLOBAL,
  context: {
    identity: {},
    routeKey: "POST|/api/v1/ping",
    clientKey: "127.0.0.1",
  },
});

if (!result.allowed) {
  // return 429
}
```

### Tune in-memory cleanup (without custom store)

```typescript
import { RateLimitCore } from "@util/rate-limit-core";

const core = new RateLimitCore({
  inMemoryStoreOptions: {
    cleanupIntervalMs: 60_000,
    maxCleanupPerRun: 1000,
  },
});
```

## Using Custom Stores (Redis, MongoDB, Other)

Any store works if it implements the `RateLimitStore.increment()` contract.

### Redis Adapter Example

```typescript
import { createClient } from "redis";
import { RateLimitCore, type RateLimitStore } from "@util/rate-limit-core";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const redisStore: RateLimitStore = {
  increment: async ({ bucketKey, windowMs, limit }) => {
    const count = await client.incr(bucketKey);
    if (count === 1) {
      await client.pExpire(bucketKey, windowMs);
    }

    const ttl = await client.pTTL(bucketKey);
    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAtMs: Date.now() + Math.max(ttl, 0),
    };
  },
};

const core = new RateLimitCore({ store: redisStore });
```

### MongoDB Adapter Example

```typescript
import { RateLimitCore, type RateLimitStore } from "@util/rate-limit-core";
import type { Collection } from "mongodb";

const createMongoStore = (collection: Collection): RateLimitStore => ({
  increment: async ({ bucketKey, windowMs, limit }) => {
    const now = Date.now();
    const resetAtMs = now + windowMs;

    const result = await collection.findOneAndUpdate(
      { bucketKey, resetAtMs: { $gt: now } },
      {
        $inc: { count: 1 },
        $setOnInsert: { resetAtMs },
      },
      { upsert: true, returnDocument: "after" }
    );

    const count = result?.count ?? 1;
    const bucketResetAtMs = result?.resetAtMs ?? resetAtMs;

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAtMs: bucketResetAtMs,
    };
  },
});

const core = new RateLimitCore({ store: createMongoStore(myCollection) });
```

### Any Other Store Template

```typescript
import type {
  RateLimitStore,
  RateLimitIncrementInput,
  RateLimitOutcome,
} from "@util/rate-limit-core";

const myStore: RateLimitStore = {
  increment: async (
    input: RateLimitIncrementInput
  ): Promise<RateLimitOutcome> => {
    // Implement atomic increment for your data store.
    return {
      allowed: true,
      remaining: 99,
      resetAtMs: Date.now() + input.windowMs,
    };
  },
};
```

## API

- `RateLimitCore.consume({ policy, context, scope })`
- `InMemoryRateLimitStore` (default store implementation)
- `buildDefaultBucketKey()` (default deterministic key builder)
