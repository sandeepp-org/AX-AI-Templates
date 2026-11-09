import "dotenv/config";

import { bootstrap } from "./bootstrap.js";
import { readAppConfig } from "./infrastructure/config/app-config.js";
import { createLogger } from "./shared/logger/logger.js";

const config = readAppConfig(process.env);
const logger = await createLogger(config.logLevel);
const server = bootstrap({ config, logger });

await server.start();
