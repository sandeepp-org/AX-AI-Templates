import type { LogLevel, LogMethod } from "./types.js";

interface ILogger {
  trace: LogMethod;
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
  child: (bindings: Record<string, unknown>) => ILogger;
  level: LogLevel;
  close: () => Promise<void>;
}

export type { ILogger };
