import { HTTP_METHODS, type RouteDefinition } from "@util/api-server";

import type { HealthService } from "../../modules/health/index.js";

import { API_VERSION } from "../../shared/constants.js";

type HealthRoutesDeps = {
  health: HealthService;
};

/** GET {API_PREFIX}/v1/health: the health report. A channel only translates HTTP to a service call. */
const healthRoutes = ({ health }: HealthRoutesDeps): RouteDefinition[] => [
  {
    path: "/health",
    version: API_VERSION,
    method: HTTP_METHODS.GET,
    handler: () => health.report(),
  },
];

export { healthRoutes };
export type { HealthRoutesDeps };
