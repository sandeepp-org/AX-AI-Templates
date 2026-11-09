import winston from "winston";
import type { ConsoleTransportConfig } from "../types.js";

const createConsoleTransport = (
  config: ConsoleTransportConfig
): winston.transport => {
  const format =
    config.format === "json" ? winston.format.json() : winston.format.simple();

  return new winston.transports.Console({
    level: config.level,
    format,
  });
};

export { createConsoleTransport };
