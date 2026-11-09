import type { Request, Response, NextFunction } from "express";

import type { ExpressMiddleware, SseSessionIdentity } from "../types.js";

type JwtClaims = {
  sub?: string;
  tenantId?: string;
  [key: string]: unknown;
};

type VerifyJwt = (token: string) => Promise<JwtClaims> | JwtClaims;

type CreateSseJwtAuthMiddlewareOptions = {
  required?: boolean;
  mapClaimsToIdentity?: (claims: JwtClaims) => SseSessionIdentity;
};

type SseAuthAugmentedRequest = Request & {
  sseIdentity?: SseSessionIdentity;
  sseClaims?: JwtClaims;
};

/**
 * Extracts a bearer token from the Authorization header if present.
 */
const extractBearerToken = (req: Request): string | null => {
  const header = req.header("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  const isBearer = scheme?.toLowerCase() === "bearer";

  if (!isBearer || !token) {
    return null;
  }

  return token;
};

/**
 * Creates an Express middleware that verifies a JWT and attaches SSE identity and claims.
 */
const createSseJwtAuthMiddleware = (
  verifyJwt: VerifyJwt,
  options?: CreateSseJwtAuthMiddlewareOptions
): ExpressMiddleware => {
  const resolvedOptions = options ?? {};
  const required = resolvedOptions.required ?? true;
  const mapClaimsToIdentity =
    resolvedOptions.mapClaimsToIdentity ??
    ((claims: JwtClaims): SseSessionIdentity => {
      const userId = typeof claims.sub === "string" ? claims.sub : undefined;
      const tenantId =
        typeof claims.tenantId === "string" ? claims.tenantId : undefined;

      return { userId, tenantId };
    });

  const middleware: ExpressMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const token = extractBearerToken(req);

    if (!token) {
      if (!required) {
        next();
        return;
      }
      res.status(401).end();
      return;
    }

    try {
      const claims = await Promise.resolve(verifyJwt(token));
      const identity = mapClaimsToIdentity(claims);
      const augReq = req as SseAuthAugmentedRequest;

      augReq.sseClaims = claims;
      augReq.sseIdentity = identity;

      next();
    } catch {
      if (!required) {
        next();
        return;
      }
      res.status(401).end();
    }
  };

  return middleware;
};

export type {
  JwtClaims,
  VerifyJwt,
  CreateSseJwtAuthMiddlewareOptions,
  SseAuthAugmentedRequest,
};

export { createSseJwtAuthMiddleware };
