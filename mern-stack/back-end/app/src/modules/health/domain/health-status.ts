/** The health vocabulary: every status a check or the whole report can carry. */
const HEALTH_STATUS = {
  OK: "ok",
  DEGRADED: "degraded",
} as const;

type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

/** The rule for the whole report: it is ok only when every check is ok; with no checks it is ok. */
const overallStatusOf = (statuses: readonly HealthStatus[]): HealthStatus =>
  statuses.every((status) => status === HEALTH_STATUS.OK)
    ? HEALTH_STATUS.OK
    : HEALTH_STATUS.DEGRADED;

export { HEALTH_STATUS, overallStatusOf };
export type { HealthStatus };
