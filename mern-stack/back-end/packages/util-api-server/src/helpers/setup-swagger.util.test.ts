import type { Logger as LoggerType } from "@util/logger";
import { Logger as LoggerImpl } from "../../../util-logger/src/logger.js";

import { ApiServer } from "../api-server.js";
import { generateOpenApiSpec } from "./setup-swagger.util.js";
import {
  DEFAULT_SWAGGER_PATH,
  DEFAULT_SWAGGER_TITLE,
  DEFAULT_SWAGGER_VERSION,
  HEALTH_ENDPOINT_PATH,
} from "../constants.js";

import type { InternalConfig } from "../types.js";
import { RATE_LIMIT_SCOPES } from "@util/rate-limit-core";
import { clearSseDocs, registerSseDoc } from "./sse-openapi-registry.util.js";

describe("setupSwagger", () => {
  const loggers: LoggerType[] = [];
  let instance: ApiServer | null = null;

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

  it("should serve Swagger UI when SWAGGER_ENABLED is true", async () => {
    const logger = await createLogger("test-swagger-enabled");
    instance = ApiServer.create({
      config: { PORT: 0, SWAGGER_ENABLED: true },
      logger,
      routes: [
        { path: "/ping", version: "v1", handler: async () => ({ pong: true }) },
      ],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}${DEFAULT_SWAGGER_PATH}/`, {
      redirect: "follow",
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("swagger-ui");
  });

  it("should not serve Swagger UI when SWAGGER_ENABLED is false", async () => {
    const logger = await createLogger("test-swagger-disabled");
    instance = ApiServer.create({
      config: { PORT: 0, SWAGGER_ENABLED: false },
      logger,
      routes: [],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}${DEFAULT_SWAGGER_PATH}/`);

    expect(res.status).toBe(404);
  });

  it("should not serve Swagger UI by default (disabled)", async () => {
    const logger = await createLogger("test-swagger-default");
    instance = ApiServer.create({
      config: { PORT: 0 },
      logger,
      routes: [],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}${DEFAULT_SWAGGER_PATH}/`);

    expect(res.status).toBe(404);
  });

  it("should serve Swagger UI at custom path", async () => {
    const logger = await createLogger("test-swagger-path");
    const customPath = "/api-docs";
    instance = ApiServer.create({
      config: { PORT: 0, SWAGGER_ENABLED: true, SWAGGER_PATH: customPath },
      logger,
      routes: [],
    });
    await instance.start();

    const baseUrl = `http://localhost:${instance.port}`;
    const res = await fetch(`${baseUrl}${customPath}/`, {
      redirect: "follow",
    });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("swagger-ui");
  });
});

describe("generateOpenApiSpec", () => {
  it("should include health endpoint and all user routes", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-spec",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;

    registerSseDoc({
      path: "/events",
      version: "v1",
      summary: "Events stream",
    });

    const config: InternalConfig = {
      port: 0,
      apiPrefix: "/api",
      allowedOrigins: [],
      bodyLimit: "1mb",
      rateLimitWindowMs: 60_000,
      rateLimitMax: 100,
      rateLimitStore: undefined,
      rateLimitScope: RATE_LIMIT_SCOPES.GLOBAL,
      rateLimitIdentityResolvers: {},
      swaggerEnabled: true,
      swaggerPath: DEFAULT_SWAGGER_PATH,
      swaggerTitle: "Test API",
      swaggerDescription: "Test description",
      swaggerVersion: "2.0.0",
      sseHeartbeatMs: 15_000,
      logger,
      routes: [
        {
          path: "/users",
          version: "v1",
          method: "GET",
          handler: async () => [],
        },
        { path: "/orders", version: "v1", handler: async () => [] },
      ],
    };

    const spec = generateOpenApiSpec(config);

    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.title).toBe("Test API");
    expect(spec.info.description).toBe("Test description");
    expect(spec.info.version).toBe("2.0.0");
    expect(spec.tags).toEqual([{ name: "v1" }]);
    expect(spec.paths[HEALTH_ENDPOINT_PATH]).toBeDefined();
    expect(spec.paths[HEALTH_ENDPOINT_PATH].get).toBeDefined();
    expect(spec.paths["/api/v1/users"]).toBeDefined();
    expect(spec.paths["/api/v1/users"].get).toBeDefined();
    expect(spec.paths["/api/v1/orders"]).toBeDefined();
    expect(spec.paths["/api/v1/orders"].post).toBeDefined();
    expect(spec.paths["/api/v1/events"]).toBeDefined();
    expect(spec.paths["/api/v1/events"].get).toBeDefined();

    await logger.close();
  });

  it("should use default title and version when not overridden", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-spec-defaults",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;

    const config: InternalConfig = {
      port: 0,
      apiPrefix: "/api",
      allowedOrigins: [],
      bodyLimit: "1mb",
      rateLimitWindowMs: 60_000,
      rateLimitMax: 100,
      rateLimitStore: undefined,
      rateLimitScope: RATE_LIMIT_SCOPES.GLOBAL,
      rateLimitIdentityResolvers: {},
      swaggerEnabled: true,
      swaggerPath: DEFAULT_SWAGGER_PATH,
      swaggerTitle: DEFAULT_SWAGGER_TITLE,
      swaggerDescription: "",
      swaggerVersion: DEFAULT_SWAGGER_VERSION,
      sseHeartbeatMs: 15_000,
      logger,
      routes: [],
    };

    const spec = generateOpenApiSpec(config);

    expect(spec.info.title).toBe(DEFAULT_SWAGGER_TITLE);
    expect(spec.info.version).toBe(DEFAULT_SWAGGER_VERSION);

    await logger.close();
  });
});
