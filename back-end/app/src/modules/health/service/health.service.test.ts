import type { HealthProbePort } from "../ports/health-probe.port.js";

import { HEALTH_STATUS } from "../domain/health-status.js";
import { HealthService } from "./health.service.js";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const serviceOver = (probes: HealthProbePort[]): HealthService =>
  HealthService.create({ probes, uptime: () => 42, now: () => NOW });

describe("HealthService.report", () => {
  it("should report ok with the uptime and the time when every probe is ok", async () => {
    const service = serviceOver([
      { check: async () => ({ name: "process", status: HEALTH_STATUS.OK }) },
    ]);

    expect(await service.report()).toEqual({
      status: "ok",
      uptime: 42,
      timestamp: "2026-01-01T00:00:00.000Z",
      checks: [{ name: "process", status: "ok" }],
    });
  });

  it("should report degraded when one probe is degraded", async () => {
    const service = serviceOver([
      { check: async () => ({ name: "process", status: HEALTH_STATUS.OK }) },
      {
        check: async () => ({
          name: "database",
          status: HEALTH_STATUS.DEGRADED,
          detail: "connection refused",
        }),
      },
    ]);

    const report = await service.report();

    expect(report.status).toBe("degraded");
    expect(report.checks[1]).toEqual({
      name: "database",
      status: "degraded",
      detail: "connection refused",
    });
  });

  it("should report a probe that throws as a degraded check carrying the message", async () => {
    const service = serviceOver([
      {
        check: async () => {
          throw new Error("probe crashed");
        },
      },
    ]);

    const report = await service.report();

    expect(report.status).toBe("degraded");
    expect(report.checks).toEqual([
      { name: "probe-1", status: "degraded", detail: "probe crashed" },
    ]);
  });
});
