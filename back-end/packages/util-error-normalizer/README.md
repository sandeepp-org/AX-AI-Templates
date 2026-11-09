# @utils/errors

Framework-agnostic error modeling and normalization utilities for Nexus apps and services.

## How it fits in

`@utils/errors` provides shared error classes and helpers that can be used by API servers, background workers, and any other services to represent and normalize errors in a consistent way. It does not depend on any specific HTTP framework or logger.

### High-level flow

1. **Domain / service layer** throws typed errors (for example `ValidationError`, `NotFoundError`).
2. **Boundary layer** (HTTP, worker, CLI) catches `unknown` errors and calls `normalizeError(error, options)`.
3. **Logging layer** receives the resulting `NormalizedError<TDetails>` and sends it to `@utils/logger` or other transports.
4. **Transport layer** (for example `@utils/api-server`) maps `NormalizedError.code` / `status` to HTTP status and response body.

This keeps error creation, normalization, logging, and HTTP mapping separated but connected by a single shared shape.

## Quick Start

```typescript
import { ValidationError, normalizeError } from "@utils/errors";

const run = () => {
  try {
    throw new ValidationError("Email is invalid", { field: "email" });
  } catch (error) {
    const normalized = normalizeError(error, { traceId: "request-123" });
    // send normalized to logger or API response mapper
  }
};
```

## Exports

| Export              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `BaseAppError`      | Base class for all application-level errors.          |
| `ValidationError`   | Error representing validation failures.               |
| `NotFoundError`     | Error representing missing resources.                 |
| `UnauthorizedError` | Error representing authentication failures.           |
| `ForbiddenError`    | Error representing authorization failures.            |
| `ConflictError`     | Error representing resource conflicts.                |
| `RateLimitError`    | Error representing rate limiting.                     |
| `InternalError`     | Error representing unexpected internal failures.      |
| `normalizeError`    | Helper to convert unknown errors into a common shape. |
| `isAppError`        | Type guard for `BaseAppError` instances.              |
| `CORE_ERROR_CODES`  | Registry of built-in error code string constants.     |

### Types

| Type                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `CoreErrorCode`         | Union of built-in error codes from `CORE_ERROR_CODES`.   |
| `ErrorCode`             | `CoreErrorCode` plus extensible string for custom codes. |
| `NormalizedError`       | Serializable error shape used across the codebase.       |
| `NormalizeErrorOptions` | Options used when normalizing errors.                    |

### Extending with your own error codes

You can define your own application-specific error codes and errors on top of the built-in registry:

```typescript
import { BaseAppError, CORE_ERROR_CODES } from "@utils/errors";

const APP_ERROR_CODES = {
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
} as const;

type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

class UserAlreadyExistsError extends BaseAppError {
  constructor(message: string, details?: { email: string }) {
    super(message, APP_ERROR_CODES.USER_ALREADY_EXISTS, 409, details);
  }
}
```

These new codes will automatically be compatible with `ErrorCode` (because it allows custom strings in addition to the core registry), and will flow through `normalizeError` and the logging/HTTP layers the same way as the built-in errors.
