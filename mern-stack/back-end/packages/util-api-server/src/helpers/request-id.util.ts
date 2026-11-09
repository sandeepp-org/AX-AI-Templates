import type { Response, NextFunction } from "express";
import type { AugmentedRequest } from "../types.js";
import type { Logger } from "@util/logger";

import { randomUUID } from "node:crypto";

import { REQUEST_ID_HEADER } from "../constants.js";

/**
 * Creates Express middleware that attaches a requestId and child logger to each request.
 */
const createRequestIdMiddleware = (logger: Logger) => {
  const middleware = (
    req: AugmentedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const requestId = randomUUID();
    req.requestId = requestId;
    req.logger = logger.child({ requestId });
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };

  return middleware;
};

export { createRequestIdMiddleware };
