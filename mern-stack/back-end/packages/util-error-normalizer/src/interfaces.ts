import type { ErrorCode } from "./types.js";

interface IAppError {
  code: ErrorCode;
  status?: number;
  details?: unknown;
}

export type { IAppError };
