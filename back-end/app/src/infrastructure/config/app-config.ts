/** The log levels the app accepts in LOG_LEVEL. */
const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const DEFAULT_PORT = 3001;
const DEFAULT_LOG_LEVEL: LogLevel = "info";
const DEFAULT_NODE_ENV = "development";
const PRODUCTION_NODE_ENV = "production";
const MAX_PORT = 65535;

/** Everything the app reads from the environment, validated once at start. */
type AppConfig = {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  logLevel: LogLevel;
};

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

// Reads PORT, refusing anything that is not a whole number a server can bind to (0 = any free port).
const readPort = (value: string | undefined): number => {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > MAX_PORT) {
    throw new Error(
      `PORT must be a whole number between 0 and ${MAX_PORT}, got "${value}"`
    );
  }
  return port;
};

// Reads LOG_LEVEL, refusing a level the logger does not know.
const readLogLevel = (value: string | undefined): LogLevel => {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_LOG_LEVEL;
  }
  if (!isLogLevel(value)) {
    throw new Error(
      `LOG_LEVEL must be one of ${LOG_LEVELS.join(", ")}, got "${value}"`
    );
  }
  return value;
};

/** Reads and validates the app's configuration; a bad value stops the start with a message naming it. */
const readAppConfig = (env: NodeJS.ProcessEnv): AppConfig => {
  const nodeEnv = env.NODE_ENV ?? DEFAULT_NODE_ENV;
  return {
    nodeEnv,
    isProduction: nodeEnv === PRODUCTION_NODE_ENV,
    port: readPort(env.PORT),
    logLevel: readLogLevel(env.LOG_LEVEL),
  };
};

export { readAppConfig, LOG_LEVELS };
export type { AppConfig, LogLevel };
