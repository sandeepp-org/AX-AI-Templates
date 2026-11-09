import type { Request, Response, Router } from "express";
import type {
  AugmentedRequest,
  ApiResponse,
  RouteContext,
  RouteDefinition,
  RateLimitIdentityResolvers,
} from "../types.js";

import type { NormalizedError } from "@util/error-normalizer";
import { normalizeError } from "@util/error-normalizer";
import { RATE_LIMIT_SCOPES, RateLimitCore } from "@util/rate-limit-core";
import type { RateLimitScope } from "@util/rate-limit-core";

import { HTTP_STATUS_CODES } from "../constants.js";
import { createRateLimitMiddleware } from "./create-rate-limit-middleware.util.js";

const DEFAULT_ROUTE_METHOD = "POST";

const SUPPORTED_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type SupportedMethod = (typeof SUPPORTED_METHODS)[number];

// Returns true if the given string is a supported Express router method.
const isSupportedMethod = (method: string): method is SupportedMethod =>
  (SUPPORTED_METHODS as readonly string[]).includes(method);

/** GET/HEAD cannot carry a JSON body per fetch spec; handlers read query instead. */
const getRouteHandlerInput = (req: Request, method: string): unknown =>
  method === "get" ? { ...req.query } : req.body;

// Registers a JSON route handler for the configured HTTP method.
const registerRouteHandler = (
  router: Router,
  route: RouteDefinition,
  rateLimitOptions: {
    rateLimitCore: RateLimitCore;
    defaultScope: RateLimitScope;
    identityResolvers: RateLimitIdentityResolvers;
  }
) => {
  const method = (route.method ?? DEFAULT_ROUTE_METHOD).toLowerCase();

  if (!isSupportedMethod(method)) {
    throw new Error(`Unsupported HTTP method for route: ${route.method}`);
  }

  const handlerWrapper = async (req: Request, res: Response): Promise<void> => {
    const result: ApiResponse = { data: null, error: null };
    const augReq = req as unknown as AugmentedRequest;
    const requestId = augReq.requestId;
    const reqLogger = augReq.logger;
    const context: RouteContext = {
      logger: reqLogger,
      requestId,
      req,
    };

    try {
      result.data = await route.handler(
        getRouteHandlerInput(req, method),
        context
      );
    } catch (err) {
      const normalized: NormalizedError = normalizeError(err, {
        defaultCode: "INTERNAL_ERROR",
        defaultStatus: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        traceId: requestId,
      });

      reqLogger.error(`${route.path} API failed`, {
        error: normalized,
      });
      result.error = normalized.message;
      res.status(normalized.status ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    res.json(result);
  };

  const middleware = route.middleware ?? [];
  const routeRateLimitMiddleware =
    route.rateLimit !== undefined
      ? [
          createRateLimitMiddleware(
            rateLimitOptions.rateLimitCore,
            route.rateLimit.policy,
            route.rateLimit.scope ?? rateLimitOptions.defaultScope,
            rateLimitOptions.identityResolvers
          ),
        ]
      : [];

  router[method](
    route.path,
    ...middleware,
    ...routeRateLimitMiddleware,
    handlerWrapper
  );
};

/**
 * Registers all RouteDefinition handlers on the given router with uniform response envelope and error logging.
 */
const registerRoutes = (
  router: Router,
  routes: RouteDefinition[],
  options: {
    rateLimitCore: RateLimitCore;
    defaultScope?: RateLimitScope;
    identityResolvers?: RateLimitIdentityResolvers;
  } = {
    rateLimitCore: new RateLimitCore(),
  }
): void => {
  for (const route of routes) {
    registerRouteHandler(router, route, {
      rateLimitCore: options.rateLimitCore,
      defaultScope: options.defaultScope ?? RATE_LIMIT_SCOPES.GLOBAL,
      identityResolvers: options.identityResolvers ?? {},
    });
  }
};

export { registerRoutes };
