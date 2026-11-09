import type { Server } from "node:http";

import express from "express";
import type { Logger as LoggerType } from "@util/logger";
import { Logger as LoggerImpl } from "../../../util-logger/src/logger.js";

import { registerRoutes } from "./register-routes.util.js";
import { createRequestIdMiddleware } from "./request-id.util.js";

describe("registerRoutes", () => {
  const servers: Server[] = [];
  const loggers: LoggerType[] = [];

  afterAll(async () => {
    for (const srv of servers) {
      srv.close();
    }
    for (const l of loggers) {
      await l.close();
    }
  });

  const createTestServer = async (
    routes: Parameters<typeof registerRoutes>[1]
  ): Promise<{ baseUrl: string; server: Server; logger: LoggerType }> => {
    const logger = (await LoggerImpl.create({
      context: "test-register-routes",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);
    const app = express();
    app.use(express.json());
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);

    const router = express.Router();
    registerRoutes(router, routes);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    return { baseUrl, server, logger };
  };

  it("should register POST routes and return { data, error } envelope", async () => {
    const responsePayload = { users: ["alice", "bob"] };
    const { baseUrl } = await createTestServer([
      {
        path: "/users",
        version: "v1",
        handler: async () => responsePayload,
      },
    ]);

    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(responsePayload);
    expect(body.error).toBeNull();
  });

  it("should register GET routes when method is provided", async () => {
    const responsePayload = { ok: true };
    const { baseUrl } = await createTestServer([
      {
        path: "/ping",
        version: "v1",
        method: "GET",
        handler: async () => responsePayload,
      },
    ]);

    const res = await fetch(`${baseUrl}/api/ping`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(responsePayload);
    expect(body.error).toBeNull();
  });

  it("should register PUT routes when method is provided", async () => {
    const responsePayload = { updated: true };
    const { baseUrl } = await createTestServer([
      {
        path: "/item",
        version: "v1",
        method: "PUT",
        handler: async () => responsePayload,
      },
    ]);

    const res = await fetch(`${baseUrl}/api/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(responsePayload);
    expect(body.error).toBeNull();
  });

  it("should register PATCH routes when method is provided", async () => {
    const responsePayload = { patched: true };
    const { baseUrl } = await createTestServer([
      {
        path: "/item",
        version: "v1",
        method: "PATCH",
        handler: async () => responsePayload,
      },
    ]);

    const res = await fetch(`${baseUrl}/api/item`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(responsePayload);
    expect(body.error).toBeNull();
  });

  it("should register DELETE routes when method is provided", async () => {
    const responsePayload = { deleted: true };
    const { baseUrl } = await createTestServer([
      {
        path: "/item",
        version: "v1",
        method: "DELETE",
        handler: async () => responsePayload,
      },
    ]);

    const res = await fetch(`${baseUrl}/api/item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(responsePayload);
    expect(body.error).toBeNull();
  });

  it("should pass request body as input to the handler", async () => {
    const inputPayload = { filter: "active" };
    let capturedInput: unknown;

    const { baseUrl } = await createTestServer([
      {
        path: "/echo",
        version: "v1",
        handler: async (input) => {
          capturedInput = input;
          return { echoed: true };
        },
      },
    ]);

    await fetch(`${baseUrl}/api/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputPayload),
    });

    expect(capturedInput).toEqual(inputPayload);
  });

  it("should pass RouteContext with logger and requestId to handler", async () => {
    let capturedRequestId: string | undefined;
    let capturedLoggerExists = false;

    const { baseUrl } = await createTestServer([
      {
        path: "/context-check",
        version: "v1",
        handler: async (_input, context) => {
          capturedRequestId = context.requestId;
          capturedLoggerExists = typeof context.logger?.info === "function";
          return { ok: true };
        },
      },
    ]);

    await fetch(`${baseUrl}/api/context-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(capturedRequestId).toBeDefined();
    expect(capturedRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(capturedLoggerExists).toBe(true);
  });

  it("should catch handler errors and return { data: null, error: message }", async () => {
    const errorMsg = "handler exploded";
    const { baseUrl } = await createTestServer([
      {
        path: "/fail",
        version: "v1",
        handler: async () => {
          throw new Error(errorMsg);
        },
      },
    ]);

    const res = await fetch(`${baseUrl}/api/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.data).toBeNull();
    expect(body.error).toBe(errorMsg);
  });

  it("should return proper error message, not [object Object]", async () => {
    const errorMsg = "serialization test error";
    const { baseUrl } = await createTestServer([
      {
        path: "/error-msg",
        version: "v1",
        handler: async () => {
          throw new Error(errorMsg);
        },
      },
    ]);

    const res = await fetch(`${baseUrl}/api/error-msg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(body.error).toBe(errorMsg);
    expect(body.error).not.toBe("[object Object]");
  });
});
