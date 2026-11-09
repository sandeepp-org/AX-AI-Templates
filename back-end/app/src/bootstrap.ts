import { ApiServer } from "@util/api-server";

import type { Logger } from "@util/logger";
import type { AppConfig } from "./infrastructure/config/app-config.js";

import { healthRoutes } from "./channels/http/health.routes.js";
import { createProcessHealthProbe } from "./infrastructure/health/process-health-probe.adapter.js";
import { HealthService } from "./modules/health/index.js";
import { API_PREFIX } from "./shared/constants.js";

type BootstrapDeps = {
  config: AppConfig;
  logger: Logger;
};

/**
 * The composition root: the one place that knows every concrete piece. It builds the adapters, hands them to the
 * services through their ports, and mounts the channels on the server. The caller starts and stops the server.
 */
const bootstrap = ({ config, logger }: BootstrapDeps): ApiServer => {
  // Infrastructure: adapters of the modules' ports.
  const probes = [createProcessHealthProbe()];

  // Modules: services over their ports.
  const health = HealthService.create({
    probes,
    uptime: () => process.uptime(),
    now: () => new Date(),
  });

  // Channels: every route the app serves. A new channel file adds its routes here.
  const routes = [...healthRoutes({ health })];

  return ApiServer.create({
    config: {
      PORT: config.port,
      API_PREFIX,
      SWAGGER_ENABLED: !config.isProduction,
      SWAGGER_TITLE: "MERN Stack API",
      SWAGGER_DESCRIPTION: "MERN Stack template API",
    },
    logger,
    onAppStart: () => {
      logger.info("App started", { environment: config.nodeEnv });
    },
    onAppStop: () => {
      logger.info("App stopping");
    },
    routes,
  });
};

export { bootstrap };
export type { BootstrapDeps };
