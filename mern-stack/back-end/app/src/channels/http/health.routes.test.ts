import request from "supertest";

import type { ApiServer } from "@util/api-server";

import { bootstrap } from "../../bootstrap.js";
import { createLogger } from "../../shared/logger/logger.js";

describe("GET /api/v1/health", () => {
  let server: ApiServer;

  beforeAll(async () => {
    const logger = await createLogger("silent");
    // Port 0 lets the operating system pick a free port, so the test never collides with a running app.
    server = bootstrap({
      config: {
        nodeEnv: "test",
        isProduction: false,
        port: 0,
        logLevel: "silent",
      },
      logger,
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should answer 200 with the health report in the response envelope", async () => {
    const response = await request(server.expressApp).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.error).toBeNull();
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.checks).toEqual([
      { name: "process", status: "ok" },
    ]);
    expect(typeof response.body.data.uptime).toBe("number");
    expect(Number.isNaN(Date.parse(response.body.data.timestamp))).toBe(false);
  });

  it("should answer 404 in the response envelope for an unknown route", async () => {
    const response = await request(server.expressApp).get("/api/v1/nope");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ data: null, error: "Not found" });
  });
});
