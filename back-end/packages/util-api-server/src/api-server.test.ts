import type { Logger as LoggerType } from "@util/logger";
import type { RateLimitStore } from "@util/rate-limit-core";
import { Logger as LoggerImpl } from "../../util-logger/src/logger.js";

import { ValidationError } from "@util/error-normalizer";

import { ApiServer } from "./api-server.js";
import { HTTP_STATUS_CODES, HEALTH_ENDPOINT_PATH } from "./constants.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a response body is asserted field by field
type JsonBody = any;

describe("ApiServer", () => {
  let instance: ApiServer | null = null;
  const loggers: LoggerType[] = [];

  const createLogger = async (context: string): Promise<LoggerType> => {
    const logger = (await LoggerImpl.create({
      context,
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);
    return logger;
  };

  afterEach(async () => {
    if (instance) {
      await instance.stop();
      instance = null;
    }
  });

  afterAll(async () => {
    for (const l of loggers) {
      await l.close();
    }
  });

  it("should create an ApiServer instance with expressApp accessible", async () => {
    const logger = await createLogger("test-create");
    instance = ApiServer.create({
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });

    expect(instance).toBeDefined();
    expect(instance.expressApp).toBeDefined();
  });

  it("should serve the built-in GET /health endpoint", async () => {
    const logger = await createLogger("test-health");
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}${HEALTH_ENDPOINT_PATH}`);
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(body.data.status).toBe("ok");
    expect(typeof body.data.uptime).toBe("number");
    expect(body.error).toBeNull();
  });

  it("should serve POST routes under API_PREFIX and return { data, error } envelope", async () => {
    const logger = await createLogger("test-routes");
    const responseData = { users: ["alice", "bob"] };
    instance = ApiServer.create({
      config: { PORT: 0, API_PREFIX: "/api" },
      logger,
      routes: [
        { path: "/users", version: "v1", handler: async () => responseData },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(body.data).toEqual(responseData);
    expect(body.error).toBeNull();
  });

  it("should pass input and RouteContext to handlers", async () => {
    const logger = await createLogger("test-context");
    const inputPayload = { filter: "active" };
    let capturedInput: unknown;
    let capturedRequestId: string | undefined;

    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        {
          path: "/echo",
          version: "v1",
          handler: async (input, context) => {
            capturedInput = input;
            capturedRequestId = context.requestId;
            return { echoed: true };
          },
        },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    await fetch(`${baseUrl}/api/v1/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputPayload),
    });

    expect(capturedInput).toEqual(inputPayload);
    expect(capturedRequestId).toBeDefined();
    expect(capturedRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("should catch handler errors and return 500 with error message", async () => {
    const logger = await createLogger("test-error");
    const errorMsg = "handler blew up";
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        {
          path: "/fail",
          version: "v1",
          handler: async () => {
            throw new Error(errorMsg);
          },
        },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/v1/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    expect(body.data).toBeNull();
    expect(body.error).toBe(errorMsg);
  });

  it("should propagate status codes from @util/error-normalizer errors", async () => {
    const logger = await createLogger("test-normalized-error-status");
    const errorMsg = "bad input";
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        {
          path: "/fail-validation",
          version: "v1",
          handler: async () => {
            throw new ValidationError(errorMsg);
          },
        },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/v1/fail-validation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST);
    expect(body.data).toBeNull();
    expect(body.error).toBe(errorMsg);
  });

  it("should return 404 for unknown routes", async () => {
    const logger = await createLogger("test-404");
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/nonexistent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.NOT_FOUND);
    expect(body.data).toBeNull();
    expect(body.error).toBe("Not found");
  });

  it("should call onAppStart during start", async () => {
    const logger = await createLogger("test-onAppStart");
    let startCalled = false;
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      onAppStart: async () => {
        startCalled = true;
      },
      routes: [],
    });
    await instance.start();

    expect(startCalled).toBe(true);
  });

  it("should call onAppStop during stop", async () => {
    const logger = await createLogger("test-onAppStop");
    let stopCalled = false;
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      onAppStop: async () => {
        stopCalled = true;
      },
      routes: [],
    });
    await instance.start();
    await instance.stop();
    instance = null;

    expect(stopCalled).toBe(true);
  });

  it("should return the same instance from getInstance after create (singleton)", async () => {
    const logger = await createLogger("test-singleton");
    const first = ApiServer.create({
      logger,
      routes: [],
    });
    const second = ApiServer.getInstance();

    expect(first).toBe(second);
    instance = first;
  });

  it("should throw from getInstance when create has not been called", () => {
    expect(() => ApiServer.getInstance()).toThrow(
      "ApiServer not initialized. Call ApiServer.create() first."
    );
  });

  it("should include X-Request-Id header in responses", async () => {
    const logger = await createLogger("test-request-id");
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/v1/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const requestId = res.headers.get("x-request-id");

    expect(requestId).toBeDefined();
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("should reinitialize cleanly after stop() and create()", async () => {
    const logger = await createLogger("test-reinit");
    const first = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await first.start();
    await first.stop();

    const second = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await second.start();
    instance = second;

    const baseUrl = `http://localhost:${second.port}`;
    const res = await fetch(`${baseUrl}/api/v1/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as JsonBody;

    expect(res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(body.data).toEqual({ pong: true });
    expect(ApiServer.getInstance()).toBe(second);
  });

  it("should enforce rate limiting after threshold is exceeded", async () => {
    const rateLimitMax = 2;
    const logger = await createLogger("test-rate-limit");
    instance = ApiServer.create({
      config: {
        PORT: 0,
        RATE_LIMIT_WINDOW_MS: 60_000,
        RATE_LIMIT_MAX: rateLimitMax,
      },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const sendRequest = () =>
      fetch(`${baseUrl}/api/v1/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

    const first = await sendRequest();
    const second = await sendRequest();
    const third = await sendRequest();

    expect(first.status).toBe(HTTP_STATUS_CODES.OK);
    expect(second.status).toBe(HTTP_STATUS_CODES.OK);
    expect(third.status).toBe(HTTP_STATUS_CODES.TOO_MANY_REQUESTS);
  });

  it("should accept a custom rate limit store from config", async () => {
    const buckets = new Map<string, { count: number; resetAtMs: number }>();
    const customStore: RateLimitStore = {
      increment: async ({ bucketKey, windowMs, limit }) => {
        const now = Date.now();
        const prev = buckets.get(bucketKey);
        const expired = prev === undefined || prev.resetAtMs <= now;
        const next = expired
          ? { count: 1, resetAtMs: now + windowMs }
          : { count: prev.count + 1, resetAtMs: prev.resetAtMs };
        buckets.set(bucketKey, next);

        return {
          allowed: next.count <= limit,
          remaining: Math.max(limit - next.count, 0),
          resetAtMs: next.resetAtMs,
        };
      },
    };

    const logger = await createLogger("test-custom-store");
    instance = ApiServer.create({
      config: {
        PORT: 0,
        RATE_LIMIT_WINDOW_MS: 60_000,
        RATE_LIMIT_MAX: 1,
        RATE_LIMIT_STORE: customStore,
      },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const first = await fetch(`${baseUrl}/api/v1/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const second = await fetch(`${baseUrl}/api/v1/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(first.status).toBe(HTTP_STATUS_CODES.OK);
    expect(second.status).toBe(HTTP_STATUS_CODES.TOO_MANY_REQUESTS);
  });

  it("should enforce per-route policy when route rateLimit is set", async () => {
    const logger = await createLogger("test-route-policy");
    instance = ApiServer.create({
      config: {
        PORT: 0,
        RATE_LIMIT_WINDOW_MS: 60_000,
        RATE_LIMIT_MAX: 100,
      },
      logger,
      routes: [
        {
          path: "/strict",
          version: "v1",
          rateLimit: {
            policy: { windowMs: 60_000, max: 1, namespace: "strict" },
          },
          handler: async () => ({ strict: true }),
        },
        {
          path: "/open",
          version: "v1",
          handler: async () => ({ open: true }),
        },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const strictFirst = await fetch(`${baseUrl}/api/v1/strict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const strictSecond = await fetch(`${baseUrl}/api/v1/strict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const open = await fetch(`${baseUrl}/api/v1/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(strictFirst.status).toBe(HTTP_STATUS_CODES.OK);
    expect(strictSecond.status).toBe(HTTP_STATUS_CODES.TOO_MANY_REQUESTS);
    expect(open.status).toBe(HTTP_STATUS_CODES.OK);
  });

  it("should include CORS headers when allowedOrigins is configured", async () => {
    const allowedOrigin = "https://example.com";
    const logger = await createLogger("test-cors");
    instance = ApiServer.create({
      config: { PORT: 0, ALLOWED_ORIGINS: [allowedOrigin] },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}/api/v1/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: allowedOrigin,
      },
      body: JSON.stringify({}),
    });
    const corsHeader = res.headers.get("access-control-allow-origin");

    expect(corsHeader).toBe(allowedOrigin);
  });

  it("should mount routes from different versions under separate prefixes", async () => {
    const logger = await createLogger("test-multi-version");
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [
        {
          path: "/items",
          version: "v1",
          method: "GET",
          handler: async () => ({ version: 1 }),
        },
        {
          path: "/items",
          version: "v2",
          method: "GET",
          handler: async () => ({ version: 2 }),
        },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;

    const v1Res = await fetch(`${baseUrl}/api/v1/items`);
    const v1Body = (await v1Res.json()) as JsonBody;

    const v2Res = await fetch(`${baseUrl}/api/v2/items`);
    const v2Body = (await v2Res.json()) as JsonBody;

    expect(v1Res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(v1Body.data).toEqual({ version: 1 });
    expect(v2Res.status).toBe(HTTP_STATUS_CODES.OK);
    expect(v2Body.data).toEqual({ version: 2 });
  });
});
