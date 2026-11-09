const LogLevel = {
  TRACE: "trace",
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
  SILENT: "silent",
} as const;

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const TransportType = {
  CONSOLE: "console",
  FILE: "file",
  MONGODB: "mongodb",
} as const;

const CUSTOM_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
} as const;

const DEFAULT_LOG_LEVEL = LogLevel.INFO;
const DEFAULT_MONGO_COLLECTION = "log";

export {
  LogLevel,
  TransportType,
  CUSTOM_LEVELS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_MONGO_COLLECTION,
};
