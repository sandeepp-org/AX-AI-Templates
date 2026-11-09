import type { Application, Request, Response, NextFunction } from "express";
import type { Server as HttpServer } from "node:http";
import type { Logger } from "@util/logger";
import type {
  RateLimitCore,
  RateLimitPolicy,
  RateLimitScope,
  RateLimitStore,
} from "@util/rate-limit-core";

const HTTP_METHODS = {
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;
type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

type SwaggerConfig = {
  SWAGGER_ENABLED?: boolean;
  SWAGGER_PATH?: string;
  SWAGGER_TITLE?: string;
  SWAGGER_DESCRIPTION?: string;
  SWAGGER_VERSION?: string;
};

type ServerConfig = {
  PORT?: number;
  API_PREFIX?: string;
  ALLOWED_ORIGINS?: string[];
  BODY_LIMIT?: string;
  RATE_LIMIT_WINDOW_MS?: number;
  RATE_LIMIT_MAX?: number;
  RATE_LIMIT_STORE?: RateLimitStore;
  RATE_LIMIT_SCOPE?: RateLimitScope;
  RATE_LIMIT_GET_ORG_ID?: (req: Request) => string | null;
  RATE_LIMIT_GET_USER_ID?: (req: Request) => string | null;
  RATE_LIMIT_GET_API_KEY_ID?: (req: Request) => string | null;
  SSE_HEARTBEAT_MS?: number;
} & SwaggerConfig;

type RateLimitIdentityResolvers = {
  getOrgId?: (req: Request) => string | null;
  getUserId?: (req: Request) => string | null;
  getApiKeyId?: (req: Request) => string | null;
};

type RouteContext = {
  logger: Logger;
  requestId: string;
  req?: Request;
};

type RouteHandler = (
  input: unknown,
  context: RouteContext
) => Promise<unknown> | unknown;

type RouteDefinition = {
  path: string;
  version: string;
  method?: HttpMethod;
  middleware?: ExpressMiddleware[];
  rateLimit?: {
    policy: RateLimitPolicy;
    scope?: RateLimitScope;
  };
  handler: RouteHandler;
};

type LifecycleCallback = () => Promise<void> | void;

type ApiServerConfig = {
  config?: ServerConfig;
  logger: Logger;
  onAppStart?: LifecycleCallback;
  onAppStop?: LifecycleCallback;
  routes: RouteDefinition[];
};

type ApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
};

type InternalConfig = {
  port: number;
  apiPrefix: string;
  allowedOrigins: string[];
  bodyLimit: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  rateLimitStore?: RateLimitStore;
  rateLimitScope: RateLimitScope;
  rateLimitIdentityResolvers: RateLimitIdentityResolvers;
  swaggerEnabled: boolean;
  swaggerPath: string;
  swaggerTitle: string;
  swaggerDescription: string;
  swaggerVersion: string;
  sseHeartbeatMs: number;
  logger: Logger;
  onAppStart?: LifecycleCallback;
  onAppStop?: LifecycleCallback;
  routes: RouteDefinition[];
};

type SseEvent = {
  data: unknown;
  event?: string;
  id?: string;
  retry?: number;
};

type SseReplayContext = {
  identity: SseSessionIdentity;
  connectionId: string;
};

type SseReplayStoreReadParams = {
  afterEventId?: string;
  context: SseReplayContext;
};

type SseReplayStoreWriteParams = {
  event: SseEvent;
  context: SseReplayContext;
};

type SseEventHistoryStore = {
  appendEvent: (params: SseReplayStoreWriteParams) => Promise<void> | void;
  getEventsAfter: (
    params: SseReplayStoreReadParams
  ) => Promise<SseEvent[]> | SseEvent[];
};

type SseSessionIdentity = {
  userId?: string;
  tenantId?: string;
  clientId?: string;
};

type SseSession = {
  connectionId: string;
  createdAt: Date;
  lastSeenEventId?: string;
  ip?: string;
  userAgent?: string;
  identity: SseSessionIdentity;
};

type SseSessionRegistry = {
  addSession: (session: SseSession) => void;
  removeSession: (connectionId: string) => void;
  getSession: (connectionId: string) => SseSession | null;
  getSessionsByUser: (userId: string) => SseSession[];
  getSessionsByTenant: (tenantId: string) => SseSession[];
  countByUser: (userId: string) => number;
  countByTenant: (tenantId: string) => number;
  countAll: () => number;
};

type SseOpenApiOptions = {
  path: string;
  version: string;
  summary?: string;
};

type SseConnectionContext = {
  send: (evt: SseEvent) => void;
  close: () => void;
  abortSignal: AbortSignal;
  requestId: string;
  logger?: Logger;
};

type CreateSseEndpointOptions = {
  heartbeatMs?: number;
  openApi?: SseOpenApiOptions;
  eventHistoryStore?: SseEventHistoryStore;
  onConnect?: (ctx: SseConnectionContext) => void;
};

type SseRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

type SseEndpoint = {
  handler: SseRequestHandler;
  publish: (evt: SseEvent) => void;
  closeAll: () => void;
};

type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

type AugmentedRequest = Request & {
  requestId: string;
  logger: Logger;
};

type SecurityOptions = {
  allowedOrigins: string[];
  bodyLimit: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  rateLimitCore: RateLimitCore;
  rateLimitScope: RateLimitScope;
  rateLimitIdentityResolvers: RateLimitIdentityResolvers;
};

type SignalHandlerDeps = {
  server: HttpServer;
  logger: Logger;
  onAppStop?: LifecycleCallback;
};

type SignalCleanup = () => void;

export type {
  HttpMethod,
  SwaggerConfig,
  ServerConfig,
  RouteContext,
  RouteHandler,
  RouteDefinition,
  LifecycleCallback,
  ApiServerConfig,
  ApiResponse,
  InternalConfig,
  ExpressMiddleware,
  AugmentedRequest,
  Application,
  HttpServer,
  SecurityOptions,
  SignalHandlerDeps,
  SignalCleanup,
  SseEvent,
  SseReplayContext,
  SseReplayStoreReadParams,
  SseReplayStoreWriteParams,
  SseEventHistoryStore,
  SseSessionIdentity,
  SseSession,
  SseSessionRegistry,
  SseConnectionContext,
  CreateSseEndpointOptions,
  SseEndpoint,
  RateLimitIdentityResolvers,
};

export { HTTP_METHODS };
