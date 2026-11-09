import type { CoreErrorCode } from "./constants.js";

type ErrorCode = CoreErrorCode | (string & {});

type NormalizedError<TDetails = unknown> = {
  code: ErrorCode;
  message: string;
  status?: number;
  details?: TDetails;
  traceId?: string;
  stack?: string;
};

type NormalizeErrorOptions<TDetails = unknown> = {
  defaultCode?: ErrorCode;
  defaultStatus?: number;
  includeStack?: boolean;
  traceId?: string;
  mapDetails?: (raw: unknown) => TDetails;
};

export type {
  CoreErrorCode,
  ErrorCode,
  NormalizedError,
  NormalizeErrorOptions,
};
