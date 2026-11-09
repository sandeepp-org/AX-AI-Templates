import type {
  HealthCheck,
  HealthReport,
} from "../entities/health-report.entity.js";
import type { HealthProbePort } from "../ports/health-probe.port.js";

import { HEALTH_STATUS, overallStatusOf } from "../domain/health-status.js";

type HealthServiceDeps = {
  /** Every dependency the report covers, in the order the report lists them. */
  probes: readonly HealthProbePort[];
  /** Seconds the process has been running. */
  uptime: () => number;
  /** The current time; injected so a test can fix it. */
  now: () => Date;
};

/** Asks every probe and folds the answers into one report. */
class HealthService {
  readonly #probes: readonly HealthProbePort[];
  readonly #uptime: () => number;
  readonly #now: () => Date;

  private constructor(deps: HealthServiceDeps) {
    this.#probes = deps.probes;
    this.#uptime = deps.uptime;
    this.#now = deps.now;
  }

  static create = (deps: HealthServiceDeps): HealthService =>
    new HealthService(deps);

  /** The current health report. A probe that throws is reported as a degraded check, never as a failed request. */
  report = async (): Promise<HealthReport> => {
    const checks = await Promise.all(this.#probes.map(this.#checked));
    return {
      status: overallStatusOf(checks.map((check) => check.status)),
      uptime: this.#uptime(),
      timestamp: this.#now().toISOString(),
      checks,
    };
  };

  // Runs one probe, turning a thrown error into a degraded check that carries the message.
  #checked = async (
    probe: HealthProbePort,
    index: number
  ): Promise<HealthCheck> => {
    try {
      return await probe.check();
    } catch (error) {
      return {
        name: `probe-${index + 1}`,
        status: HEALTH_STATUS.DEGRADED,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

export { HealthService };
export type { HealthServiceDeps };
