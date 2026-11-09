import type {
  InMemoryRateLimitStoreOptions,
  RateLimitIncrementInput,
  RateLimitOutcome,
  RateLimitStore,
} from "./types.js";
import {
  DEFAULT_IN_MEMORY_CLEANUP_INTERVAL_MS,
  DEFAULT_IN_MEMORY_MAX_CLEANUP_PER_RUN,
} from "./constants.js";

type InMemoryBucketState = {
  count: number;
  resetAtMs: number;
};

// Stores fixed-window counters in process memory for default local rate limiting.
class InMemoryRateLimitStore implements RateLimitStore {
  #buckets: Map<string, InMemoryBucketState>;
  #cleanupIntervalMs: number;
  #maxCleanupPerRun: number;
  #lastCleanupAtMs: number;

  constructor(options?: InMemoryRateLimitStoreOptions) {
    this.#buckets = new Map<string, InMemoryBucketState>();
    this.#cleanupIntervalMs =
      options?.cleanupIntervalMs ?? DEFAULT_IN_MEMORY_CLEANUP_INTERVAL_MS;
    this.#maxCleanupPerRun =
      options?.maxCleanupPerRun ?? DEFAULT_IN_MEMORY_MAX_CLEANUP_PER_RUN;
    this.#lastCleanupAtMs = 0;
  }

  // Removes expired buckets at a bounded rate to prevent unbounded growth.
  #cleanupExpiredBuckets = (now: number): void => {
    if (now - this.#lastCleanupAtMs < this.#cleanupIntervalMs) {
      return;
    }

    let cleaned = 0;
    for (const [key, state] of this.#buckets) {
      if (state.resetAtMs <= now) {
        this.#buckets.delete(key);
        cleaned += 1;
      }

      if (cleaned >= this.#maxCleanupPerRun) {
        break;
      }
    }

    this.#lastCleanupAtMs = now;
  };

  // Increments the counter for a bucket and returns allowance metadata.
  increment = async ({
    bucketKey,
    windowMs,
    limit,
  }: RateLimitIncrementInput): Promise<RateLimitOutcome> => {
    const now = Date.now();
    this.#cleanupExpiredBuckets(now);

    const existing = this.#buckets.get(bucketKey);
    const shouldReset = existing === undefined || existing.resetAtMs <= now;

    const nextState: InMemoryBucketState = shouldReset
      ? { count: 1, resetAtMs: now + windowMs }
      : { count: existing.count + 1, resetAtMs: existing.resetAtMs };

    this.#buckets.set(bucketKey, nextState);

    const remaining = Math.max(limit - nextState.count, 0);
    return {
      allowed: nextState.count <= limit,
      remaining,
      resetAtMs: nextState.resetAtMs,
    };
  };
}

export { InMemoryRateLimitStore };
