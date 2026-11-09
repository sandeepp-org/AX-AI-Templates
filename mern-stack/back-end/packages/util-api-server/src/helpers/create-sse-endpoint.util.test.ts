import type { Server } from "node:http";

import express from "express";

import type { Logger as LoggerType } from "@util/logger";
import { Logger as LoggerImpl } from "../../../util-logger/src/logger.js";

import { createRequestIdMiddleware } from "./request-id.util.js";
import { createSseEndpoint } from "./create-sse-endpoint.util.js";
import { clearSseDocs } from "./sse-openapi-registry.util.js";

// Reads from a streaming fetch response until a predicate matches or timeout expires.
const readStreamUntil = async (params: {
  res: Response;
  predicate: (text: string) => boolean;
  timeoutMs: number;
}): Promise<string> => {
  const { res, predicate, timeoutMs } = params;
  const body = res.body;
  if (!body) {
    throw new Error("Response has no body stream");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    text += decoder.decode(value, { stream: true });
    if (predicate(text)) {
      break;
    }
  }

  return text;
};

describe("createSseEndpoint", () => {
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

  it("should stream events via publish() and include SSE content-type", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-create-sse-endpoint",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);

    const app = express();
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);

    const sse = createSseEndpoint(
      {
        heartbeatMs: 50,
        openApi: { path: "/events", version: "v1", summary: "Events" },
      },
      { logger }
    );

    const router = express.Router();
    router.get("/events", sse.handler);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/api/events`, {
      method: "GET",
      signal: controller.signal,
    });

    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`Unexpected status ${res.status}: ${text}`);
    }
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    sse.publish({ event: "user.updated", data: { id: "123" } });

    const text = await readStreamUntil({
      res,
      predicate: (t) => t.includes("event: user.updated"),
      timeoutMs: 1_000,
    });

    expect(text).toContain("event: user.updated");
    expect(text).toContain(`data: {"id":"123"}`);

    controller.abort();
    sse.closeAll();
  });

  it("should deliver heartbeat comments within the configured interval", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-sse-heartbeat",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);

    const app = express();
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);

    const sse = createSseEndpoint({ heartbeatMs: 50 }, { logger });

    const router = express.Router();
    router.get("/hb", sse.handler);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/api/hb`, { signal: controller.signal });

    const text = await readStreamUntil({
      res,
      predicate: (t) => t.includes(": heartbeat"),
      timeoutMs: 500,
    });

    expect(text).toContain(": heartbeat");

    controller.abort();
    sse.closeAll();
  });

  it("should provide send, close, abortSignal, requestId, and logger via onConnect", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-sse-onconnect",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);

    let capturedCtx: Record<string, unknown> | null = null;

    const app = express();
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);

    const sse = createSseEndpoint(
      {
        onConnect: (ctx) => {
          capturedCtx = {
            hasSend: typeof ctx.send === "function",
            hasClose: typeof ctx.close === "function",
            hasAbortSignal: ctx.abortSignal instanceof AbortSignal,
            hasRequestId:
              typeof ctx.requestId === "string" && ctx.requestId.length > 0,
            hasLogger: ctx.logger !== undefined,
          };
        },
      },
      { logger }
    );

    const router = express.Router();
    router.get("/ctx", sse.handler);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const controller = new AbortController();
    await fetch(`${baseUrl}/api/ctx`, { signal: controller.signal });

    expect(capturedCtx).not.toBeNull();
    expect(capturedCtx!.hasSend).toBe(true);
    expect(capturedCtx!.hasClose).toBe(true);
    expect(capturedCtx!.hasAbortSignal).toBe(true);
    expect(capturedCtx!.hasRequestId).toBe(true);
    expect(capturedCtx!.hasLogger).toBe(true);

    controller.abort();
    sse.closeAll();
  });

  it("should end client stream when closeAll() is called", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-sse-closeall",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);

    const app = express();
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);

    const sse = createSseEndpoint({ heartbeatMs: 60_000 }, { logger });

    const router = express.Router();
    router.get("/close", sse.handler);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const res = await fetch(`${baseUrl}/api/close`);

    sse.closeAll();

    const reader = res.body!.getReader();
    const { done } = await reader.read();

    expect(done).toBe(true);
  });

  it("should replay missed events after Last-Event-ID and continue live stream", async () => {
    clearSseDocs();
    const logger = (await LoggerImpl.create({
      context: "test-sse-reconnect-replay",
      transports: [{ type: "console" }],
    })) as unknown as LoggerType;
    loggers.push(logger);

    const eventHistory: Array<{ id: string; payload: unknown }> = [];
    const eventHistoryStore = {
      appendEvent: (params: { event: { id?: string; data: unknown } }) => {
        const eventId = params.event.id;
        if (!eventId) {
          return;
        }
        eventHistory.push({ id: eventId, payload: params.event.data });
      },
      getEventsAfter: (params: { afterEventId?: string }) => {
        if (!params.afterEventId) {
          return [];
        }
        const afterId = Number(params.afterEventId);
        return eventHistory
          .filter((entry) => Number(entry.id) > afterId)
          .map((entry) => ({
            id: entry.id,
            event: "replayed",
            data: entry.payload,
          }));
      },
    };

    const app = express();
    app.use(createRequestIdMiddleware(logger) as express.RequestHandler);
    const sse = createSseEndpoint(
      {
        heartbeatMs: 100,
        eventHistoryStore,
      },
      { logger }
    );

    const router = express.Router();
    router.get("/reconnect", sse.handler);
    app.use("/api", router);

    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const firstController = new AbortController();
    const firstRes = await fetch(`${baseUrl}/api/reconnect`, {
      signal: firstController.signal,
    });
    expect(firstRes.status).toBe(200);

    sse.publish({ id: "1", event: "live", data: { order: 1 } });
    sse.publish({ id: "2", event: "live", data: { order: 2 } });

    await readStreamUntil({
      res: firstRes,
      predicate: (text) => text.includes("id: 2"),
      timeoutMs: 1_000,
    });
    firstController.abort();

    const secondController = new AbortController();
    const secondRes = await fetch(`${baseUrl}/api/reconnect`, {
      signal: secondController.signal,
      headers: {
        "Last-Event-ID": "1",
      },
    });
    expect(secondRes.status).toBe(200);

    sse.publish({ id: "3", event: "live", data: { order: 3 } });

    const replayAndLiveText = await readStreamUntil({
      res: secondRes,
      predicate: (text) =>
        text.includes("event: replayed") && text.includes("id: 3"),
      timeoutMs: 1_500,
    });

    expect(replayAndLiveText).toContain("id: 2");
    expect(replayAndLiveText).toContain("event: replayed");
    expect(replayAndLiveText).toContain('data: {"order":2}');
    expect(replayAndLiveText).toContain("id: 3");
    expect(replayAndLiveText).toContain("event: live");

    secondController.abort();
    sse.closeAll();
  });
});
