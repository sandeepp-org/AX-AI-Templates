import type { Server as HttpServer } from "node:http";
import type {
  ApiServerConfig,
  InternalConfig,
  ApiResponse,
  Application,
  SignalCleanup,
  RouteDefinition,
} from "./types.js";
import type { ApiServerContract } from "./interfaces.js";

import type { NormalizedError } from "@util/error-normalizer";
import { normalizeError } from "@util/error-normalizer";

import express, { Router } from "express";
import { RateLimitCore, RATE_LIMIT_SCOPES } from "@util/rate-limit-core";

import { setupSecurity } from "./helpers/setup-security.util.js";
import { createRequestIdMiddleware } from "./helpers/request-id.util.js";
import { registerRoutes } from "./helpers/register-routes.util.js";
import { setupSignals } from "./helpers/setup-signals.util.js";
import { setupSwagger } from "./helpers/setup-swagger.util.js";
import {
  DEFAULT_PORT,
  DEFAULT_API_PREFIX,
  DEFAULT_BODY_LIMIT,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_SWAGGER_ENABLED,
  DEFAULT_SWAGGER_PATH,
  DEFAULT_SWAGGER_TITLE,
  DEFAULT_SWAGGER_VERSION,
  DEFAULT_SSE_HEARTBEAT_MS,
  HEALTH_ENDPOINT_PATH,
  HTTP_STATUS_CODES,
  LISTEN_TIMEOUT_MS,
} from "./constants.js";

/**
 * Normalizes the external ApiServer configuration into an internal config object with defaults.
 */
const buildInternalConfig = (input: ApiServerConfig): InternalConfig => {
  const { config: serverConfig, logger, onAppStart, onAppStop, routes } = input;

  return {
    port: serverConfig?.PORT ?? DEFAULT_PORT,
    apiPrefix: serverConfig?.API_PREFIX ?? DEFAULT_API_PREFIX,
    allowedOrigins: serverConfig?.ALLOWED_ORIGINS ?? [],
    bodyLimit: serverConfig?.BODY_LIMIT ?? DEFAULT_BODY_LIMIT,
    rateLimitWindowMs:
      serverConfig?.RATE_LIMIT_WINDOW_MS ?? DEFAULT_RATE_LIMIT_WINDOW_MS,
    rateLimitMax: serverConfig?.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX,
    rateLimitStore: serverConfig?.RATE_LIMIT_STORE,
    rateLimitScope: serverConfig?.RATE_LIMIT_SCOPE ?? RATE_LIMIT_SCOPES.GLOBAL,
    rateLimitIdentityResolvers: {
      getOrgId: serverConfig?.RATE_LIMIT_GET_ORG_ID,
      getUserId: serverConfig?.RATE_LIMIT_GET_USER_ID,
      getApiKeyId: serverConfig?.RATE_LIMIT_GET_API_KEY_ID,
    },
    swaggerEnabled: serverConfig?.SWAGGER_ENABLED ?? DEFAULT_SWAGGER_ENABLED,
    swaggerPath: serverConfig?.SWAGGER_PATH ?? DEFAULT_SWAGGER_PATH,
    swaggerTitle: serverConfig?.SWAGGER_TITLE ?? DEFAULT_SWAGGER_TITLE,
    swaggerDescription: serverConfig?.SWAGGER_DESCRIPTION ?? "",
    swaggerVersion: serverConfig?.SWAGGER_VERSION ?? DEFAULT_SWAGGER_VERSION,
    sseHeartbeatMs: serverConfig?.SSE_HEARTBEAT_MS ?? DEFAULT_SSE_HEARTBEAT_MS,
    logger,
    onAppStart,
    onAppStop,
    routes,
  };
};

/**
 * Builds and configures an Express application (security, request ID, swagger, health).
 */
const buildExpressApp = (
  config: InternalConfig,
  rateLimitCore: RateLimitCore
): Application => {
  const app = express();

  setupSecurity(app, {
    allowedOrigins: config.allowedOrigins,
    bodyLimit: config.bodyLimit,
    rateLimitWindowMs: config.rateLimitWindowMs,
    rateLimitMax: config.rateLimitMax,
    rateLimitCore,
    rateLimitScope: config.rateLimitScope,
    rateLimitIdentityResolvers: config.rateLimitIdentityResolvers,
  });

  app.use(createRequestIdMiddleware(config.logger) as express.RequestHandler);

  setupSwagger(app, config);

  app.get(HEALTH_ENDPOINT_PATH, (_req, res) => {
    const result: ApiResponse = {
      data: { status: "ok", uptime: process.uptime() },
      error: null,
    };
    res.json(result);
  });

  return app;
};

// Groups route definitions by their version field, preserving insertion order.
const groupRoutesByVersion = (
  routes: RouteDefinition[]
): Map<string, RouteDefinition[]> => {
  const map = new Map<string, RouteDefinition[]>();

  for (const route of routes) {
    const group = map.get(route.version) ?? [];
    group.push(route);
    map.set(route.version, group);
  }

  return map;
};

/**
 * Mounts versioned routers under {apiPrefix}/{version} and attaches 404 and error handlers.
 */
const mountRouterAndErrorHandlers = (
  app: Application,
  config: InternalConfig,
  rateLimitCore: RateLimitCore
): void => {
  const routesByVersion = groupRoutesByVersion(config.routes);

  for (const [version, versionRoutes] of routesByVersion) {
    const router = Router();
    registerRoutes(router, versionRoutes, {
      rateLimitCore,
      defaultScope: config.rateLimitScope,
      identityResolvers: config.rateLimitIdentityResolvers,
    });
    app.use(`${config.apiPrefix}/${version}`, router);
  }

  app.use((_req, res) => {
    const result: ApiResponse = { data: null, error: "Not found" };
    res.status(HTTP_STATUS_CODES.NOT_FOUND).json(result);
  });

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const normalizedError: NormalizedError = normalizeError(err, {
        defaultCode: "INTERNAL_ERROR",
        defaultStatus: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      });

      config.logger.error("Unhandled server error", {
        error: normalizedError,
      });

      const result: ApiResponse = {
        data: null,
        error: "Internal server error",
      };

      res
        .status(
          normalizedError.status ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
        )
        .json(result);
    }
  );
};

/**
 * High-level HTTP API server wrapper around an Express app and Node HTTP server.
 */
class ApiServer implements ApiServerContract {
  static #instance: ApiServer | null = null;

  #app: Application;
  #server: HttpServer | null;
  #config: InternalConfig;
  #rateLimitCore: RateLimitCore;
  #signalCleanup: SignalCleanup | null;
  #running: boolean;

  private constructor(
    app: Application,
    config: InternalConfig,
    rateLimitCore: RateLimitCore
  ) {
    this.#app = app;
    this.#server = null;
    this.#config = config;
    this.#rateLimitCore = rateLimitCore;
    this.#signalCleanup = null;
    this.#running = false;
  }

  /**
   * Creates and stores the ApiServer singleton using the provided configuration and routes.
   */
  static create = (input: ApiServerConfig): ApiServer => {
    const config = buildInternalConfig(input);
    const rateLimitCore = new RateLimitCore({
      store: config.rateLimitStore,
    });
    const app = buildExpressApp(config, rateLimitCore);

    const instance = new ApiServer(app, config, rateLimitCore);

    ApiServer.#instance = instance;

    return instance;
  };

  /**
   * Returns the previously created ApiServer singleton or throws if not initialized.
   */
  static getInstance = (): ApiServer => {
    const isNotInitialized = ApiServer.#instance === null;

    if (isNotInitialized) {
      throw new Error(
        "ApiServer not initialized. Call ApiServer.create() first."
      );
    }

    return ApiServer.#instance!;
  };

  /**
   * Exposes the underlying Express application instance for advanced customization.
   */
  get expressApp(): Application {
    return this.#app;
  }

  /**
   * Returns the port the HTTP server is currently bound to, falling back to configured port.
   */
  get port(): number {
    const addr = this.#server?.address();
    const resolvedPort =
      typeof addr === "object" && addr !== null ? addr.port : this.#config.port;

    return resolvedPort;
  }

  /**
   * Starts the HTTP server, runs onAppStart, and wires signal handlers for graceful shutdown.
   */
  start = async (): Promise<void> => {
    if (this.#running) {
      throw new Error("ApiServer is already running. Call stop() first.");
    }

    this.#running = true;

    mountRouterAndErrorHandlers(this.#app, this.#config, this.#rateLimitCore);

    await this.#config.onAppStart?.();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(`ApiServer failed to bind within ${LISTEN_TIMEOUT_MS}ms`)
        );
      }, LISTEN_TIMEOUT_MS);

      const server = this.#app.listen(this.#config.port, () => {
        clearTimeout(timeout);
        this.#server = server;
        this.#config.logger.info(`ApiServer listening on port ${this.port}`);
        resolve();
      });

      server.once("error", (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    }).catch((err: Error) => {
      this.#running = false;
      throw err;
    });

    this.#signalCleanup = setupSignals({
      server: this.#server!,
      logger: this.#config.logger,
      onAppStop: this.#config.onAppStop,
    });
  };

  /**
   * Stops the HTTP server, runs onAppStop, and clears the ApiServer singleton when appropriate.
   */
  stop = async (): Promise<void> => {
    const isSingleton = ApiServer.#instance === this;
    if (isSingleton) {
      ApiServer.#instance = null;
    }

    if (!this.#running) {
      return;
    }

    this.#running = false;

    this.#signalCleanup?.();
    this.#signalCleanup = null;

    await this.#config.onAppStop?.();

    const server = this.#server;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      this.#server = null;
    }

    this.#config.logger.info("ApiServer stopped");
  };
}

export { ApiServer };
