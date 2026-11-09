import { Logger } from "./logger.js";

import type {
  LogLevel,
  LoggerConfig,
  TransportConfig,
  LogMethod,
  FileTransportConfig,
  ConsoleTransportConfig,
  MongoTransportConfig,
} from "./types.js";
import type { ILogger } from "./interfaces.js";

export { Logger };

export type {
  LogLevel,
  LoggerConfig,
  TransportConfig,
  LogMethod,
  FileTransportConfig,
  ConsoleTransportConfig,
  MongoTransportConfig,
  ILogger,
};
