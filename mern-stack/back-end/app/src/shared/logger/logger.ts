import { Logger } from "@util/logger";

/** The name every log line of this app carries. */
const LOG_CONTEXT = "app";

/** Creates the app's logger: one console transport at the given level. */
const createLogger = (
  level: NonNullable<Parameters<typeof Logger.create>[0]>["level"]
): Promise<Logger> =>
  Logger.create({
    level,
    context: LOG_CONTEXT,
    transports: [{ type: "console", format: "simple" }],
  });

export { createLogger };
