import type { ConsumeInput, RateLimitOutcome } from "./types.js";

interface RateLimitCoreContract {
  consume: (input: ConsumeInput) => Promise<RateLimitOutcome>;
}

export type { RateLimitCoreContract };
