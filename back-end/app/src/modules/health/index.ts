// The module's public API: nothing else in this folder is imported from outside it.
export { HEALTH_STATUS } from "./domain/health-status.js";
export { HealthService } from "./service/health.service.js";

export type { HealthStatus } from "./domain/health-status.js";
export type {
  HealthCheck,
  HealthReport,
} from "./entities/health-report.entity.js";
export type { HealthProbePort } from "./ports/health-probe.port.js";
export type { HealthServiceDeps } from "./service/health.service.js";
