const RATE_LIMIT_SCOPES = {
  GLOBAL: "global",
  ORG: "org",
  USER: "user",
  API_KEY: "apiKey",
  ROUTE: "route",
  COMPOSITE: "composite",
} as const;

type RateLimitScope =
  (typeof RATE_LIMIT_SCOPES)[keyof typeof RATE_LIMIT_SCOPES];

type RateLimitIdentity = {
  orgId?: string | null;
  userId?: string | null;
  apiKeyId?: string | null;
};

type RateLimitRequestContext = {
  identity: RateLimitIdentity;
  routeKey: string;
  clientKey: string;
};

type RateLimitPolicy = {
  windowMs: number;
  max: number;
  namespace?: string;
};

type RateLimitOutcome = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
};

type RateLimitIncrementInput = {
  bucketKey: string;
  windowMs: number;
  limit: number;
};

interface RateLimitStore {
  increment: (input: RateLimitIncrementInput) => Promise<RateLimitOutcome>;
}

type BuildBucketKeyInput = {
  policy: RateLimitPolicy;
  context: RateLimitRequestContext;
  scope: RateLimitScope;
};

type BuildBucketKeyFn = (input: BuildBucketKeyInput) => string;

type ConsumeInput = {
  policy: RateLimitPolicy;
  context: RateLimitRequestContext;
  scope: RateLimitScope;
};

type RateLimitCoreOptions = {
  store?: RateLimitStore;
  buildBucketKey?: BuildBucketKeyFn;
  inMemoryStoreOptions?: InMemoryRateLimitStoreOptions;
};

type InMemoryRateLimitStoreOptions = {
  cleanupIntervalMs?: number;
  maxCleanupPerRun?: number;
};

export { RATE_LIMIT_SCOPES };

export type {
  RateLimitScope,
  RateLimitIdentity,
  RateLimitRequestContext,
  RateLimitPolicy,
  RateLimitOutcome,
  RateLimitIncrementInput,
  RateLimitStore,
  BuildBucketKeyInput,
  BuildBucketKeyFn,
  ConsumeInput,
  RateLimitCoreOptions,
  InMemoryRateLimitStoreOptions,
};
