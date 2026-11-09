import type { Request, Response } from "express";
import type { Logger } from "@util/logger";

import { randomUUID } from "node:crypto";

import type {
  AugmentedRequest,
  CreateSseEndpointOptions,
  SseEvent,
  SseEndpoint,
  SseConnectionContext,
  SseReplayContext,
  SseSession,
  SseSessionIdentity,
  SseSessionRegistry,
} from "../types.js";

import { DEFAULT_SSE_HEARTBEAT_MS } from "../constants.js";
import { registerSseDoc } from "./sse-openapi-registry.util.js";

const SSE_CONTENT_TYPE = "text/event-stream";
const SSE_CACHE_CONTROL = "no-cache";
const SSE_CONNECTION = "keep-alive";
const SSE_ACCEL_BUFFERING_HEADER = "X-Accel-Buffering";
const SSE_ACCEL_BUFFERING_VALUE = "no";
const SSE_HEARTBEAT_PAYLOAD = ": heartbeat\n\n";

type SseConnection = {
  res: Response;
  abortController: AbortController;
  heartbeatTimer: NodeJS.Timeout | null;
  closed: boolean;
};

type CreateSseEndpointDeps = {
  logger?: Logger;
  sessionRegistry?: SseSessionRegistry;
};

type RequestWithSseIdentity = Request & {
  sseIdentity?: SseSessionIdentity;
};

// Checks whether the underlying response socket is still writable.
const isWritable = (res: Response): boolean => {
  const socket = res.socket;
  const writable = socket !== null && !socket.destroyed && res.writable;
  return writable;
};

const flushIfSupported = (res: Response): void => {
  // `res.flush()` exists when using compression/etag middlewares that attach flush support.
  // It is safe to no-op when not available.
  const anyRes = res as unknown as { flush?: () => void };
  anyRes.flush?.call(res);
};

// Formats the event into an SSE-compliant wire payload.
const formatSseEvent = (evt: SseEvent): string => {
  const lines: string[] = [];

  if (evt.retry !== undefined) {
    lines.push(`retry: ${evt.retry}`);
  }
  if (evt.id) {
    lines.push(`id: ${evt.id}`);
  }
  if (evt.event) {
    lines.push(`event: ${evt.event}`);
  }

  const dataJson = JSON.stringify(evt.data ?? null);
  lines.push(`data: ${dataJson}`);
  lines.push("");

  const payload = `${lines.join("\n")}\n`;
  return payload;
};

// Writes an SSE event payload to the response stream if still writable.
const writeSseEvent = (res: Response, evt: SseEvent): void => {
  if (!isWritable(res)) {
    return;
  }
  const payload = formatSseEvent(evt);
  res.write(payload);
  flushIfSupported(res);
};

// Applies standard SSE headers and flushes if supported.
const setupSseResponse = (res: Response): void => {
  res.setHeader("Content-Type", SSE_CONTENT_TYPE);
  res.setHeader("Cache-Control", SSE_CACHE_CONTROL);
  res.setHeader("Connection", SSE_CONNECTION);
  res.setHeader(SSE_ACCEL_BUFFERING_HEADER, SSE_ACCEL_BUFFERING_VALUE);

  const flushHeaders = (res as unknown as { flushHeaders?: () => void })
    .flushHeaders;
  flushHeaders?.call(res);
};

// Resolves requestId and request-scoped logger if the request was augmented.
const resolveRequestContext = (
  req: Request,
  deps: CreateSseEndpointDeps
): { requestId: string; logger?: Logger } => {
  const augReq = req as unknown as Partial<AugmentedRequest>;
  const requestId = augReq.requestId ?? randomUUID();
  const logger = augReq.logger ?? deps.logger;

  return { requestId, logger };
};

// Resolves the session identity for an SSE connection from the request or falls back to an empty identity.
const resolveSessionIdentity = (req: Request): SseSessionIdentity => {
  const withIdentity = req as RequestWithSseIdentity;
  const identity = withIdentity.sseIdentity ?? {};
  return identity;
};

// Builds a session metadata object for the current SSE connection.
const buildSseSession = (params: {
  connectionId: string;
  req: Request;
  identity: SseSessionIdentity;
}): SseSession => {
  const { connectionId, req, identity } = params;
  const ip = req.ip;
  const userAgent = req.get("user-agent") ?? undefined;
  const lastEventIdHeader = req.get("last-event-id") ?? undefined;

  return {
    connectionId,
    createdAt: new Date(),
    lastSeenEventId: lastEventIdHeader,
    ip,
    userAgent,
    identity,
  };
};

// Builds replay context payload used by event history stores.
const buildReplayContext = (params: {
  identity: SseSessionIdentity;
  connectionId: string;
}): SseReplayContext => {
  const { identity, connectionId } = params;
  return { identity, connectionId };
};

// Replays missed events after Last-Event-ID before the onConnect hook runs.
const replayMissedEvents = async (params: {
  req: Request;
  res: Response;
  options?: CreateSseEndpointOptions;
  identity: SseSessionIdentity;
  connectionId: string;
}): Promise<void> => {
  const { req, res, options, identity, connectionId } = params;
  const store = options?.eventHistoryStore;

  if (!store) {
    return;
  }

  const afterEventId = req.get("last-event-id") ?? undefined;
  const context = buildReplayContext({ identity, connectionId });
  const events = await Promise.resolve(
    store.getEventsAfter({
      afterEventId,
      context,
    })
  );

  for (const event of events) {
    writeSseEvent(res, event);
  }
};

// Starts the heartbeat loop that keeps intermediaries from timing out idle SSE connections.
const startHeartbeat = (res: Response, heartbeatMs: number): NodeJS.Timeout => {
  const timer = setInterval(() => {
    if (isWritable(res)) {
      res.write(SSE_HEARTBEAT_PAYLOAD);
      flushIfSupported(res);
    }
  }, heartbeatMs);

  return timer;
};

// Tears down a single SSE connection (idempotent via closed flag).
const teardownConnection = (
  connection: SseConnection,
  connections: Set<SseConnection>
): void => {
  if (connection.closed) {
    return;
  }
  connection.closed = true;
  connection.abortController.abort();
  if (connection.heartbeatTimer) {
    clearInterval(connection.heartbeatTimer);
    connection.heartbeatTimer = null;
  }
  connections.delete(connection);
  if (isWritable(connection.res)) {
    connection.res.end();
  }
};

// Builds a connection-scoped send/close API and registers disconnect cleanup.
const attachConnection = (params: {
  req: Request;
  res: Response;
  connection: SseConnection;
  connections: Set<SseConnection>;
  heartbeatMs: number;
  deps: CreateSseEndpointDeps;
  identity: SseSessionIdentity;
  connectionId: string;
}): SseConnectionContext => {
  const { req, res, connection, connections, heartbeatMs, deps } = params;
  const { requestId, logger } = resolveRequestContext(req, deps);
  const { identity, connectionId } = params;
  const sessionRegistry = deps.sessionRegistry;

  if (sessionRegistry) {
    const session = buildSseSession({ connectionId, req, identity });
    sessionRegistry.addSession(session);
  }

  const send = (evt: SseEvent) => {
    writeSseEvent(res, evt);
  };

  const close = () => {
    if (sessionRegistry) {
      sessionRegistry.removeSession(connectionId);
    }
    teardownConnection(connection, connections);
  };

  setupSseResponse(res);

  connections.add(connection);
  connection.heartbeatTimer = startHeartbeat(res, heartbeatMs);

  req.on("close", () => {
    if (sessionRegistry) {
      sessionRegistry.removeSession(connectionId);
    }
    teardownConnection(connection, connections);
  });

  return {
    send,
    close,
    abortSignal: connection.abortController.signal,
    requestId,
    logger,
  };
};

// Creates an SSE endpoint with an Express handler plus endpoint-level publish/closeAll functions.
const createSseEndpoint = (
  options?: CreateSseEndpointOptions,
  deps?: CreateSseEndpointDeps
): SseEndpoint => {
  const resolvedDeps: CreateSseEndpointDeps = deps ?? {};
  const heartbeatMs = options?.heartbeatMs ?? DEFAULT_SSE_HEARTBEAT_MS;
  const connections = new Set<SseConnection>();

  if (options?.openApi) {
    registerSseDoc(options.openApi);
  }

  const publish = (evt: SseEvent): void => {
    const store = options?.eventHistoryStore;

    if (store) {
      const context = buildReplayContext({
        identity: {},
        connectionId: "broadcast",
      });
      void Promise.resolve(
        store.appendEvent({
          event: evt,
          context,
        })
      );
    }

    for (const connection of connections) {
      writeSseEvent(connection.res, evt);
    }
  };

  const closeAll = (): void => {
    for (const connection of [...connections]) {
      teardownConnection(connection, connections);
    }
  };

  const handler = (req: Request, res: Response): void => {
    const connection: SseConnection = {
      res,
      abortController: new AbortController(),
      heartbeatTimer: null,
      closed: false,
    };

    const identity = resolveSessionIdentity(req);
    const connectionId = randomUUID();

    const ctx = attachConnection({
      req,
      res,
      connection,
      connections,
      heartbeatMs,
      deps: resolvedDeps,
      identity,
      connectionId,
    });

    void replayMissedEvents({ req, res, options, identity, connectionId })
      .then(() => {
        const onConnect = options?.onConnect;
        if (onConnect) {
          onConnect(ctx);
        }
      })
      .catch(() => {
        const onConnect = options?.onConnect;
        if (onConnect) {
          onConnect(ctx);
        }
      });
  };

  return {
    handler,
    publish,
    closeAll,
  };
};

export { createSseEndpoint };
