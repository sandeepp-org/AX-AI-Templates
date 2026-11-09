import type { Request, Response, NextFunction } from "express";
import type {
  RateLimitCore,
  RateLimitPolicy,
  RateLimitScope,
} from "@util/rate-limit-core";
import type { RateLimitIdentityResolvers } from "../types.js";

import { HTTP_STATUS_CODES } from "../constants.js";

// Builds a stable route identifier for bucket partitioning.
const buildRouteKey = (req: Request): string => {
  const method = req.method.toUpperCase();
  const routePath = req.route?.path ?? req.path;
  return `${method}|${routePath}`;
};

// Extracts client identity fallback key from express request metadata.
const buildClientKey = (req: Request): string => {
  return req.ip ?? "unknown-client";
};

// Resolves optional identity dimensions for org/user/api-key scoped policies.
const buildIdentity = (
  req: Request,
  resolvers: RateLimitIdentityResolvers
): {
  orgId?: string | null;
  userId?: string | null;
  apiKeyId?: string | null;
} => {
  return {
    orgId: resolvers.getOrgId?.(req) ?? null,
    userId: resolvers.getUserId?.(req) ?? null,
    apiKeyId: resolvers.getApiKeyId?.(req) ?? null,
  };
};

// Creates an express middleware that delegates rate-limit checks to core engine.
const createRateLimitMiddleware = (
  rateLimitCore: RateLimitCore,
  policy: RateLimitPolicy,
  scope: RateLimitScope,
  identityResolvers: RateLimitIdentityResolvers
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rateLimitCore.consume({
        policy,
        scope,
        context: {
          identity: buildIdentity(req, identityResolvers),
          routeKey: buildRouteKey(req),
          clientKey: buildClientKey(req),
        },
      });

      res.setHeader("x-ratelimit-limit", String(policy.max));
      res.setHeader("x-ratelimit-remaining", String(result.remaining));
      res.setHeader(
        "x-ratelimit-reset",
        String(Math.ceil(result.resetAtMs / 1000))
      );

      if (!result.allowed) {
        res.status(HTTP_STATUS_CODES.TOO_MANY_REQUESTS).json({
          data: null,
          error: "Too many requests",
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export { createRateLimitMiddleware };
