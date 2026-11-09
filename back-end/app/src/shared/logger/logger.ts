import { Logger } from "@util/logger";

let logger: Logger;

const initLogger = async (): Promise<Logger> => {
  logger = await Logger.create({
    level: "info",
    transports: [{ type: "console", format: "simple" }],
  });
  return logger;
};

export { logger, initLogger };
