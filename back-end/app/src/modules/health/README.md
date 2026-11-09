# health

Reports whether the app and the things it depends on are working.

## What it is

- `HealthService.report()` asks every probe it was given and folds the answers into one `HealthReport`.
- The report is `ok` only when every check is `ok` (`domain/health-status.ts`).
- A probe that throws becomes a `degraded` check; the request itself never fails because a dependency is down.

## Public API (`index.ts`)

- `HealthService`, `HealthServiceDeps`
- `HEALTH_STATUS`, `HealthStatus`
- `HealthReport`, `HealthCheck`
- `HealthProbePort`: what infrastructure implements for each dependency

## Adding a dependency check

1. Write an adapter in `src/infrastructure/health/` that implements `HealthProbePort` (see `process-health-probe.adapter.ts`).
2. Add it to the `probes` list in `src/bootstrap.ts`.

Nothing in this module changes.
