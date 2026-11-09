import type { HealthCheck } from "../entities/health-report.entity.js";

/**
 * One dependency the service asks about its health. The module owns this shape; infrastructure implements it
 * (the process, a database, a cache), so the service never imports a driver.
 */
type HealthProbePort = {
  check: () => Promise<HealthCheck>;
};

export type { HealthProbePort };
