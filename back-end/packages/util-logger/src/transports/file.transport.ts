import { dirname, basename } from "node:path";
import winston from "winston";
import type { FileTransportConfig } from "../types.js";

const createFileTransport = (
  config: FileTransportConfig
): winston.transport => {
  const format =
    config.format === "json" ? winston.format.json() : winston.format.simple();

  return new winston.transports.File({
    dirname: dirname(config.filename),
    filename: basename(config.filename),
    level: config.level,
    format,
  });
};

export { createFileTransport };
