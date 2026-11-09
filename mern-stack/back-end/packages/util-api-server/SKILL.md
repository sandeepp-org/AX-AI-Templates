---
name: util-api-server
description: Zero-boilerplate Express API server with built-in security (helmet, CORS, rate limiting, compression), structured error handling, request-id child loggers, and graceful shutdown. Use when the user needs an API server with minimal setup.
metadata:
  author: aatmix
  version: "0.0.1"
  path: packages/util-api-server
---

# @util/api-server

Zero-boilerplate Express API server for Node.js/TypeScript projects.

For full API reference see [README.md](./README.md).

## When to Use

Use this package when you need:

- A production-ready API server with minimal boilerplate
- Built-in security middleware (helmet, CORS, rate limiting, compression)
- Method-aware routes (GET, POST, PUT, PATCH, DELETE) with uniform `{ data, error }` response envelope
- Express-first SSE helper (`createSseEndpoint`) with publish-anywhere and per-connection send/close
- Per-request child loggers with auto-generated request IDs
- Graceful shutdown with process signal handling
- Lifecycle callbacks (onAppStart, onAppStop)

## Quick usage

```typescript
import { ApiServer } from "@util/api-server";
import { Logger } from "@util/logger";

const logger = await Logger.create({
  context: "MyApp",
  transports: [{ type: "console" }],
});

const server = ApiServer.create({
  config: { PORT: 3001 },
  logger,
  routes: [
    {
      path: "/hello",
      handler: async (input, { logger }) => {
        logger.info("Hello handler called");
        return { message: "hello world" };
      },
    },
  ],
});

await server.start();

// SSE endpoints setup
import type { Router } from "express";

import { createSseEndpoint } from "@util/api-server";

const CONNECT_DELAY_MS = 2_000;

const userEvents = createSseEndpoint({
  openApi: { path: "/events/users", version: "v1", summary: "User events" },
  onConnect: ({ send, abortSignal }) => {
    send({ event: "connected", data: { ok: true } });

    const timer = setTimeout(() => {
      if (!abortSignal.aborted) {
        send({ event: "delayed", data: { afterMs: CONNECT_DELAY_MS } });
      }
    }, CONNECT_DELAY_MS);

    abortSignal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
      },
      { once: true }
    );
  },
});

// Mounts all SSE endpoints on the provided Express router (mounted under API_PREFIX).
const mountSseRoutes = (router: Router): void => {
  router.get("/v1/events/users", userEvents.handler);
};

export { mountSseRoutes, userEvents };
```

See [README.md](./README.md) for custom config, lifecycle callbacks, middleware extension, singleton, and full API reference.

## Rules

- Logger is **required** — the app creates and passes an `@util/logger` instance.
- Connection strings and secrets must come from environment variables, never hardcoded.
