import winston from "winston";

import type { LogLevel, LoggerConfig, LogMethod } from "./types.js";

import { buildTransports } from "./helpers/build-transports.util.js";
import { buildRedactFormat } from "./helpers/build-redact-format.util.js";
import {
  CUSTOM_LEVELS,
  DEFAULT_LOG_LEVEL,
  TransportType,
} from "./constants.js";
import type { ILogger } from "./interfaces.js";

/**
 * Creates a LogMethod that delegates to the given winston logger at the specified level.
 */
const createLogMethod = (
  winstonLogger: winston.Logger,
  level: string
): LogMethod => {
  const logMethod: LogMethod = (msg, data) => {
    if (data) {
      winstonLogger.log(level, msg, data);
    } else {
      winstonLogger.log(level, msg);
    }
  };

  return logMethod;
};

/**
 * Structured application logger with JSON output, transports, and child loggers.
 */
class Logger implements ILogger {
  static #instance: Logger | null = null;

  #winston: winston.Logger;
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;

  private constructor(winstonInstance: winston.Logger) {
    this.#winston = winstonInstance;
    this.trace = createLogMethod(winstonInstance, "trace");
    this.debug = createLogMethod(winstonInstance, "debug");
    this.info = createLogMethod(winstonInstance, "info");
    this.warn = createLogMethod(winstonInstance, "warn");
    this.error = createLogMethod(winstonInstance, "error");
    this.fatal = createLogMethod(winstonInstance, "fatal");
  }

  /**
   * Creates and configures the singleton Logger instance with the given options.
   */
  static create = async (config?: LoggerConfig): Promise<Logger> => {
    const {
      level = DEFAULT_LOG_LEVEL,
      context,
      timestamp = true,
      defaultMeta,
      transports = [{ type: TransportType.CONSOLE }],
    } = config ?? {};

    const transportInstances = await buildTransports(transports);

    const meta: Record<string, unknown> = {
      ...(defaultMeta ?? {}),
      ...(context ? { context } : {}),
    };

    const winstonInstance = winston.createLogger({
      levels: CUSTOM_LEVELS,
      level,
      format: winston.format.combine(
        timestamp
          ? winston.format.timestamp()
          : winston.format((info) => info)(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: Object.keys(meta).length > 0 ? meta : undefined,
      transports: transportInstances,
    });

    const hasRedactPaths = config?.redact?.length;
    if (hasRedactPaths) {
      winstonInstance.format = buildRedactFormat(
        config.redact!,
        winstonInstance.format
      );
    }

    const logger = new Logger(winstonInstance);
    Logger.#instance = logger;

    return logger;
  };

  /**
   * Returns the previously created Logger singleton or throws if not initialized.
   */
  static getInstance = (): Logger => {
    if (Logger.#instance === null) {
      throw new Error("Logger not initialized. Call Logger.create() first.");
    }

    return Logger.#instance;
  };

  /**
   * Gets the current minimum log level for this logger.
   */
  get level(): LogLevel {
    return this.#winston.level as LogLevel;
  }

  /**
   * Sets the minimum log level; messages below this level are ignored.
   */
  set level(value: LogLevel) {
    this.#winston.level = value;
  }

  /**
   * Creates a child logger that always includes the provided bindings in its metadata.
   */
  child = (bindings: Record<string, unknown>): Logger => {
    const childLogger = this.#winston.child(bindings);

    return new Logger(childLogger);
  };

  /**
   * Closes all underlying transports and clears the singleton reference when appropriate.
   */
  close = async (): Promise<void> => {
    if (Logger.#instance === this) {
      Logger.#instance = null;
    }

    await new Promise<void>((resolve) => {
      this.#winston.on("finish", () => resolve());
      this.#winston.end();
    });
  };
}

export { Logger };
