import type {
  NormalizeErrorOptions,
  NormalizedError,
  ErrorCode,
} from "../types.js";

import { BaseAppError } from "../errors.js";
import {
  CORE_ERROR_CODES,
  CORE_ERROR_STATUS,
  DEFAULT_ERROR_MESSAGE,
} from "../constants.js";

const FALLBACK_CODE: ErrorCode = CORE_ERROR_CODES.INTERNAL_ERROR;
const FALLBACK_STATUS = CORE_ERROR_STATUS[CORE_ERROR_CODES.INTERNAL_ERROR];

/**
 * Resolves the core normalized shape based on the runtime type of the thrown value.
 */
const resolveErrorShape = <TDetails>(
  error: unknown,
  code: ErrorCode,
  status: number,
  mapDetails?: (raw: unknown) => TDetails
): NormalizedError<TDetails> => {
  let result: NormalizedError<TDetails> = {
    code,
    message: DEFAULT_ERROR_MESSAGE,
    status,
  };

  if (error instanceof BaseAppError) {
    result = {
      code: error.code,
      message: error.message,
      status: error.status ?? status,
      details: error.details as TDetails | undefined,
    };
  } else if (error instanceof Error) {
    result = {
      code,
      message: error.message || DEFAULT_ERROR_MESSAGE,
      status,
    };
  } else if (typeof error === "string") {
    result = { code, message: error, status };
  } else if (typeof error === "number") {
    result = { code, message: String(error), status };
  } else if (error && typeof error === "object") {
    const details = mapDetails ? mapDetails(error) : (error as TDetails);
    result = { code, message: DEFAULT_ERROR_MESSAGE, status, details };
  }

  return result;
};

/**
 * Attaches optional traceId and stack to an already-resolved normalized error.
 */
const attachMetadata = <TDetails>(
  normalized: NormalizedError<TDetails>,
  error: unknown,
  traceId?: string,
  includeStack?: boolean
): NormalizedError<TDetails> => {
  if (traceId) {
    normalized.traceId = traceId;
  }

  const stack =
    includeStack && error instanceof Error ? error.stack : undefined;
  if (stack) {
    normalized.stack = stack;
  }

  return normalized;
};

/**
 * Converts any unknown thrown value into a consistent NormalizedError shape.
 */
const normalizeError = <TDetails = unknown>(
  error: unknown,
  options?: NormalizeErrorOptions<TDetails>
): NormalizedError<TDetails> => {
  const merged: NormalizeErrorOptions<TDetails> = {
    defaultCode: FALLBACK_CODE,
    defaultStatus: FALLBACK_STATUS,
    includeStack: false,
    ...options,
  };

  const code = merged.defaultCode ?? FALLBACK_CODE;
  const status = merged.defaultStatus ?? FALLBACK_STATUS;

  const shape = resolveErrorShape(error, code, status, merged.mapDetails);
  const result = attachMetadata(
    shape,
    error,
    merged.traceId,
    merged.includeStack
  );

  return result;
};

/**
 * Type guard that narrows an unknown value to BaseAppError.
 */
const isAppError = (error: unknown): error is BaseAppError => {
  const isInstance = error instanceof BaseAppError;
  return isInstance;
};

export { normalizeError, isAppError };
