import type { SignalHandlerDeps, SignalCleanup } from "../types.js";

import { GRACEFUL_SHUTDOWN_TIMEOUT_MS } from "../constants.js";
import { serializeError } from "./serialize-error.util.js";

let shutdownStarted = false;

type LogLine = (msg: string, data?: Record<string, unknown>) => void;

const safeLog = (
  log: LogLine,
  msg: string,
  data?: Record<string, unknown>
): void => {
  try {
    if (data !== undefined) {
      log(msg, data);
    } else {
      log(msg);
    }
  } catch {
    process.stderr.write(`${msg}\n`);
  }
};

/**
 * Performs a graceful shutdown sequence for the HTTP server, with timeout and logging.
 * Re-entrant: concurrent or nested calls (e.g. logger throwing during uncaughtException) no-op.
 */
const gracefulShutdown = async (
  signal: string,
  deps: SignalHandlerDeps
): Promise<void> => {
  if (shutdownStarted) {
    return;
  }
  shutdownStarted = true;

  const { server, logger, onAppStop } = deps;

  safeLog(
    logger.info.bind(logger) as LogLine,
    `Received ${signal}, shutting down gracefully`
  );

  const forceExitTimer = setTimeout(() => {
    safeLog(
      logger.error.bind(logger) as LogLine,
      "Graceful shutdown timed out, forcing exit"
    );
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  try {
    await onAppStop?.();
  } catch (err) {
    safeLog(logger.error.bind(logger) as LogLine, "onAppStop callback failed", {
      error: serializeError(err),
    });
  }

  server.close(() => {
    safeLog(logger.info.bind(logger) as LogLine, "HTTP server closed");
    process.exit(0);
  });
};

/**
 * Registers process signal and error handlers and returns a cleanup function to remove them.
 */
const setupSignals = (deps: SignalHandlerDeps): SignalCleanup => {
  const { logger } = deps;

  const onSigterm = (): void => {
    gracefulShutdown("SIGTERM", deps);
  };
  const onSigint = (): void => {
    gracefulShutdown("SIGINT", deps);
  };
  const onUnhandledRejection = (reason: unknown): void => {
    logger.error("Unhandled rejection", {
      error: serializeError(reason),
    });
  };
  const onUncaughtException = (err: Error): void => {
    process.removeListener("uncaughtException", onUncaughtException);
    safeLog(
      logger.fatal.bind(logger) as LogLine,
      "Uncaught exception -- shutting down",
      {
        error: serializeError(err),
      }
    );
    void gracefulShutdown("uncaughtException", deps);
  };

  process.on("SIGTERM", onSigterm);
  process.on("SIGINT", onSigint);
  process.on("unhandledRejection", onUnhandledRejection);
  process.on("uncaughtException", onUncaughtException);

  const cleanup = (): void => {
    process.removeListener("SIGTERM", onSigterm);
    process.removeListener("SIGINT", onSigint);
    process.removeListener("unhandledRejection", onUnhandledRejection);
    process.removeListener("uncaughtException", onUncaughtException);
  };

  return cleanup;
};

export { setupSignals, gracefulShutdown };
