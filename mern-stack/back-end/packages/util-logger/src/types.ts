import type { LogLevel } from "./constants.js";
import { TransportType } from "./constants.js";

type LogMethod = (msg: string, data?: Record<string, unknown>) => void;

type ConsoleTransportConfig = {
  type: typeof TransportType.CONSOLE;
  level?: LogLevel;
  format?: "simple" | "json";
};

type MongoTransportConfig = {
  type: typeof TransportType.MONGODB;
  level?: LogLevel;
  uri: string;
  collection?: string;
  storeHost?: boolean;
};

type FileTransportConfig = {
  type: typeof TransportType.FILE;
  filename: string;
  level?: LogLevel;
  format?: "simple" | "json";
};

type TransportConfig =
  ConsoleTransportConfig | MongoTransportConfig | FileTransportConfig;

type LoggerConfig = {
  level?: LogLevel;
  context?: string;
  redact?: string[];
  timestamp?: boolean;
  defaultMeta?: Record<string, unknown>;
  transports?: TransportConfig[];
};

export type {
  LogLevel,
  LogMethod,
  ConsoleTransportConfig,
  FileTransportConfig,
  MongoTransportConfig,
  TransportConfig,
  LoggerConfig,
};
