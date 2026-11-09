import winston from "winston";
import type { MongoTransportConfig } from "../types.js";
import { DEFAULT_MONGO_COLLECTION } from "../constants.js";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- winston-mongodb patches winston.transports
  require("winston-mongodb");
} catch {
  // Optional peer dep - will fail at runtime if mongo transport used without mongodb
}

/**
 * Creates a winston-mongodb transport.
 *
 * Note: When using custom levels (trace, debug, info, warn, error, fatal), the transport's
 * level filter uses winston-mongodb's internal level ordering. If you observe unexpected
 * filtering (e.g. messages above the configured level being dropped), use standard levels
 * (info, warn, error) for the MongoDB transport or avoid per-transport level overrides.
 */
const createMongodbTransport = (
  config: MongoTransportConfig
): winston.transport => {
  const MongoDB = (
    winston.transports as unknown as {
      MongoDB: new (opts: unknown) => winston.transport;
    }
  ).MongoDB;
  return new MongoDB({
    level: config.level,
    db: config.uri,
    collection: config.collection ?? DEFAULT_MONGO_COLLECTION,
    storeHost: config.storeHost ?? false,
  });
};

export { createMongodbTransport };
