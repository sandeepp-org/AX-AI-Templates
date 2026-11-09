import type { ErrorCode } from "./types.js";
import type { IAppError } from "./interfaces.js";
import { CORE_ERROR_CODES, CORE_ERROR_STATUS } from "./constants.js";

class BaseAppError extends Error implements IAppError {
  code: ErrorCode;

  status?: number;

  details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class ValidationError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.VALIDATION_ERROR,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.VALIDATION_ERROR],
      details
    );
  }
}

class NotFoundError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.NOT_FOUND,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.NOT_FOUND],
      details
    );
  }
}

class UnauthorizedError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.UNAUTHORIZED,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.UNAUTHORIZED],
      details
    );
  }
}

class ForbiddenError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.FORBIDDEN,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.FORBIDDEN],
      details
    );
  }
}

class ConflictError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.CONFLICT,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.CONFLICT],
      details
    );
  }
}

class RateLimitError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.RATE_LIMIT,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.RATE_LIMIT],
      details
    );
  }
}

class InternalError extends BaseAppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      CORE_ERROR_CODES.INTERNAL_ERROR,
      CORE_ERROR_STATUS[CORE_ERROR_CODES.INTERNAL_ERROR],
      details
    );
  }
}

export {
  BaseAppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  InternalError,
};
