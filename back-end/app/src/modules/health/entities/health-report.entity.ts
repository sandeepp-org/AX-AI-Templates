import type { HealthStatus } from "../domain/health-status.js";

/** What one probe found about one dependency. */
type HealthCheck = {
  /** The dependency's name, as a reader of the report knows it: "process", "database". */
  name: string;
  status: HealthStatus;
  /** Why the check is degraded; absent when it is ok. */
  detail?: string;
};

/** The whole answer of the health endpoint. */
type HealthReport = {
  status: HealthStatus;
  /** Seconds this process has been running. */
  uptime: number;
  /** When the report was produced, ISO 8601. */
  timestamp: string;
  checks: HealthCheck[];
};

export type { HealthCheck, HealthReport };
