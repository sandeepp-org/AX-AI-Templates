import { BaseAppError } from "./errors.js";
import {
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "./errors.js";
import { normalizeError, isAppError } from "./helpers/normalize-error.util.js";

import { CORE_ERROR_CODES } from "./constants.js";
import type {
  CoreErrorCode,
  ErrorCode,
  NormalizeErrorOptions,
  NormalizedError,
} from "./types.js";
import type { IAppError } from "./interfaces.js";

export {
  BaseAppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  InternalError,
  normalizeError,
  isAppError,
  CORE_ERROR_CODES,
};

export type {
  CoreErrorCode,
  ErrorCode,
  NormalizedError,
  NormalizeErrorOptions,
  IAppError,
};
