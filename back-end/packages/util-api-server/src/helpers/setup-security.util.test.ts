import type { Server } from "node:http";

import express from "express";

import { setupSecurity } from "./setup-security.util.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a response body is asserted field by field
type JsonBody = any;

const createTestApp = (
  options?: Parameters<typeof setupSecurity>[1]
): express.Application => {
  const app = express();
  setupSecurity(app, options);
  app.get("/test", (_req, res) => {
    res.json({ ok: true });
  });
  return app;
};

describe("setupSecurity", () => {
  const servers: Server[] = [];

  afterAll(() => {
    for (const srv of servers) {
      srv.close();
    }
  });

  it("should apply helmet security headers", async () => {
    const app = createTestApp();
    const server = app.listen(0);
    servers.push(server);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://localhost:${port}`;

    const res = await fetch(`${baseUrl}/test`);

    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBeDefined();
  });

  it("should allow all origins when no ALLOWED_ORIGINS provided", async () => {
    const app = createTestApp({ allowedOrigins: [] });
    const srv = app.listen(0);
    servers.push(srv);
    const address = srv.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://localhost:${port}`;

    const origin = "http://example.com";
    const res = await fetch(`${url}/test`, {
      headers: { Origin: origin },
    });

    expect(res.headers.get("access-control-allow-origin")).toBe(origin);
  });

  it("should restrict to specific origins when ALLOWED_ORIGINS provided", async () => {
    const allowedOrigin = "http://myapp.com";
    const app = createTestApp({ allowedOrigins: [allowedOrigin] });
    const srv = app.listen(0);
    servers.push(srv);
    const address = srv.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://localhost:${port}`;

    const allowedRes = await fetch(`${url}/test`, {
      headers: { Origin: allowedOrigin },
    });
    expect(allowedRes.headers.get("access-control-allow-origin")).toBe(
      allowedOrigin
    );
  });

  it("should parse JSON request bodies", async () => {
    const app = express();
    setupSecurity(app);
    app.post("/echo", (req, res) => {
      res.json({ body: req.body });
    });
    const srv = app.listen(0);
    servers.push(srv);
    const address = srv.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://localhost:${port}`;

    const payload = { greeting: "hello" };
    const res = await fetch(`${url}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as JsonBody;

    expect(data.body).toEqual(payload);
  });

  it("should enforce rate limiting", async () => {
    const rateLimitMax = 3;
    const app = createTestApp({
      rateLimitMax,
      rateLimitWindowMs: 60_000,
    });
    const srv = app.listen(0);
    servers.push(srv);
    const address = srv.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const url = `http://localhost:${port}`;

    const responses: Response[] = [];
    for (let i = 0; i < rateLimitMax + 1; i++) {
      responses.push(await fetch(`${url}/test`));
    }

    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
  });
});
