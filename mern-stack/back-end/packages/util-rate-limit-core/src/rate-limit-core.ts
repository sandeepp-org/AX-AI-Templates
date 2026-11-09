import { buildDefaultBucketKey } from "./helpers/build-bucket-key.util.js";
import { InMemoryRateLimitStore } from "./in-memory-rate-limit-store.js";

import type {
  ConsumeInput,
  RateLimitCoreOptions,
  RateLimitOutcome,
  RateLimitStore,
} from "./types.js";
import type { RateLimitCoreContract } from "./interfaces.js";

// Coordinates policy + key building + store increment for one consume call.
class RateLimitCore implements RateLimitCoreContract {
  #store: RateLimitStore;
  #buildBucketKey: NonNullable<RateLimitCoreOptions["buildBucketKey"]>;

  constructor(options?: RateLimitCoreOptions) {
    this.#store =
      options?.store ??
      new InMemoryRateLimitStore(options?.inMemoryStoreOptions);
    this.#buildBucketKey = options?.buildBucketKey ?? buildDefaultBucketKey;
  }

  // Consumes one token from a computed bucket and returns remaining quota.
  consume = async (input: ConsumeInput): Promise<RateLimitOutcome> => {
    const bucketKey = this.#buildBucketKey(input);

    return this.#store.increment({
      bucketKey,
      windowMs: input.policy.windowMs,
      limit: input.policy.max,
    });
  };
}

export { RateLimitCore };
