import {
  ANON_BUCKET_SEGMENT,
  BUCKET_KEY_SEPARATOR,
  DEFAULT_RATE_LIMIT_NAMESPACE,
} from "../constants.js";

import type {
  BuildBucketKeyFn,
  BuildBucketKeyInput,
  RateLimitIdentity,
} from "../types.js";
import { RATE_LIMIT_SCOPES } from "../types.js";

// Normalizes any optional identity segment to a stable, non-empty bucket value.
const normalizeSegment = (value?: string | null): string =>
  value && value.length > 0 ? value : ANON_BUCKET_SEGMENT;

// Maps the selected scope to the ordered identity segments used in bucket keys.
const buildScopedIdentitySegments = (
  scope: BuildBucketKeyInput["scope"],
  identity: RateLimitIdentity,
  clientKey: string
): string[] => {
  if (scope === RATE_LIMIT_SCOPES.ORG) {
    return [normalizeSegment(identity.orgId)];
  }

  if (scope === RATE_LIMIT_SCOPES.USER) {
    return [normalizeSegment(identity.userId)];
  }

  if (scope === RATE_LIMIT_SCOPES.API_KEY) {
    return [normalizeSegment(identity.apiKeyId)];
  }

  if (scope === RATE_LIMIT_SCOPES.ROUTE) {
    return [];
  }

  if (scope === RATE_LIMIT_SCOPES.COMPOSITE) {
    return [
      normalizeSegment(identity.orgId),
      normalizeSegment(identity.userId),
      normalizeSegment(identity.apiKeyId),
    ];
  }

  return [normalizeSegment(clientKey)];
};

// Creates a deterministic bucket key for store-level increment operations.
const buildDefaultBucketKey: BuildBucketKeyFn = ({
  policy,
  context,
  scope,
}: BuildBucketKeyInput): string => {
  const namespace = policy.namespace ?? DEFAULT_RATE_LIMIT_NAMESPACE;
  const identitySegments = buildScopedIdentitySegments(
    scope,
    context.identity,
    context.clientKey
  );

  const routeSegment =
    scope === RATE_LIMIT_SCOPES.GLOBAL
      ? ANON_BUCKET_SEGMENT
      : normalizeSegment(context.routeKey);
  const segments = [
    namespace,
    scope,
    ...identitySegments,
    routeSegment,
    normalizeSegment(context.clientKey),
  ];

  return segments.join(BUCKET_KEY_SEPARATOR);
};

export { buildDefaultBucketKey };
