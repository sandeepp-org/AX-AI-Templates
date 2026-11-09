import { apiGet } from "../../../shared/api/rest-client";

/** What GET /api/v1/health answers. */
type HealthReport = {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
};

const fetchHealth = (): Promise<HealthReport> =>
  apiGet<HealthReport>("/health");

export { fetchHealth };
export type { HealthReport };
