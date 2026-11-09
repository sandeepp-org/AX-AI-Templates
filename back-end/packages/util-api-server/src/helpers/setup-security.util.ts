import type { Application, SecurityOptions } from "../types.js";

import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { RATE_LIMIT_SCOPES, RateLimitCore } from "@util/rate-limit-core";

import {
  DEFAULT_BODY_LIMIT,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
} from "../constants.js";
import { createRateLimitMiddleware } from "./create-rate-limit-middleware.util.js";

/**
 * Builds a CORS options object based on the configured allowed origins.
 */
const buildCorsOptions = (allowedOrigins: string[]): cors.CorsOptions => {
  const options: cors.CorsOptions =
    allowedOrigins.length > 0
      ? { origin: allowedOrigins, credentials: true }
      : { origin: true, credentials: true };

  return options;
};

/**
 * Configures common HTTP security middleware (helmet, CORS, compression, body limits, rate limiting).
 */
const setupSecurity = (
  app: Application,
  options?: Partial<SecurityOptions>
): void => {
  const {
    allowedOrigins = [],
    bodyLimit = DEFAULT_BODY_LIMIT,
    rateLimitWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
    rateLimitMax = DEFAULT_RATE_LIMIT_MAX,
  } = options ?? {};
  const rateLimitCore = options?.rateLimitCore ?? new RateLimitCore();

  app.use(helmet());
  app.use(cors(buildCorsOptions(allowedOrigins)));
  app.use(compression());
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
  app.use(
    createRateLimitMiddleware(
      rateLimitCore,
      {
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
        namespace: "global",
      },
      options?.rateLimitScope ?? RATE_LIMIT_SCOPES.GLOBAL,
      options?.rateLimitIdentityResolvers ?? {}
    )
  );
};

export { setupSecurity };
