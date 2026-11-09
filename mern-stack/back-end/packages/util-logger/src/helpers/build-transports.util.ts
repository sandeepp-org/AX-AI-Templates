import type winston from "winston";
import type { TransportConfig } from "../types.js";
import { createConsoleTransport } from "../transports/console.transport.js";
import { createFileTransport } from "../transports/file.transport.js";
import { TransportType } from "../constants.js";

const buildTransports = async (
  configs: TransportConfig[]
): Promise<winston.transport[]> => {
  const transports: winston.transport[] = [];

  for (const config of configs) {
    if (config.type === TransportType.CONSOLE) {
      transports.push(createConsoleTransport(config));
    } else if (config.type === TransportType.FILE) {
      transports.push(createFileTransport(config));
    } else if (config.type === TransportType.MONGODB) {
      const { createMongodbTransport } =
        await import("../transports/mongodb.transport.js");
      transports.push(createMongodbTransport(config));
    }
  }

  return transports;
};

export { buildTransports };
