# @util/error-normalizer Design Plan

`@util/error-normalizer` is a framework-agnostic package that provides shared error classes and helpers for modeling and normalizing errors across Nexus apps and services.

## Goals

- Provide a common base error type for application and domain errors.
- Offer a normalized, serializable error shape that can be logged or returned to clients.
- Remain independent of any specific HTTP framework or logger implementation.

## Core Concepts

- `BaseAppError` is the root for all custom errors.
- Specific subclasses model common categories such as validation, not found, unauthorized, forbidden, conflict, rate limit, and internal errors.
- `NormalizedError<TDetails>` is the standardized, serializable error shape.
- `NormalizeErrorOptions<TDetails>` controls how `normalizeError` behaves (defaults, stack, trace id, and details mapping).
- `normalizeError<TDetails>()` converts any `unknown` error value into a `NormalizedError<TDetails>`.
- `isAppError()` is a type guard for `BaseAppError`.

## Runtime Flow (how it works)

1. **Throw errors in domain/service code**
   - Application and domain logic throw instances of `BaseAppError` subclasses:
     - Example: `throw new ValidationError("Email is invalid", { field: "email" });`
   - These errors carry a `code`, optional `status`, and optional `details` payload.

2. **Catch at the boundary (HTTP/worker/CLI)**
   - Top-level handlers catch `unknown` errors at process boundaries:
     - HTTP frameworks (for example `@util/api-server` Express middleware).
     - Background job runners.
     - CLI command runners.

3. **Normalize the error**
   - The boundary layer calls `normalizeError(error, options)`:
     - If the error is a `BaseAppError`, its `code`, `message`, `status`, and `details` are preserved.
     - If the error is a generic `Error`, a default code (`INTERNAL_ERROR`) and status (500) are applied.
     - If the error is a string/number, it becomes the `message`.
     - If the error is an object, it is placed into `details`, optionally transformed through `mapDetails`.
   - The result is a `NormalizedError<TDetails>` with:
     - `code` – machine-friendly error code.
     - `message` – safe message for logs / responses.
     - `status` – transport-friendly status (for example HTTP).
     - `details` – typed payload describing extra context.
     - `traceId` and `stack` when requested.

4. **Log with a structured payload**
   - The host app passes `NormalizedError` to `@util/logger` or other logging infrastructure:
     - Example: `logger.error("Unhandled server error", { error: normalizedError });`
   - This keeps logs consistent across all apps and services.

5. **Map to transport-specific responses**
   - API servers use `NormalizedError.status` (or the error `code`) to determine HTTP status codes and response bodies:
     - Example mapping: `VALIDATION_ERROR` → 400, `NOT_FOUND` → 404, `INTERNAL_ERROR` → 500.
   - Other transports (message queues, gRPC, CLIs) can map the same `NormalizedError` to their own response formats.

## Integration Points

- **API server (`@util/api-server`)**
  - Uses `normalizeError` in its global Express error middleware.
  - Logs the resulting `NormalizedError` and uses `status` to set the HTTP response status.
  - Keeps the HTTP response body simple while the logger still receives full structured details.

- **Logger (`@util/logger`)**
  - Receives `NormalizedError<TDetails>` instances as part of log metadata.
  - Can be extended later to apply redaction or enrichment policies based on `code` or `details`.

## Problem Definition

Every boundary in a Node.js application (HTTP handler, worker, CLI) catches `unknown` errors. Without a shared convention, each service invents its own error shape, leading to inconsistent logs, unpredictable API responses, and duplicated boilerplate. `@util/error-normalizer` provides a single canonical error model and converter so all Nexus services handle errors identically.

## Requirements

| #   | Requirement                                           | Status |
| --- | ----------------------------------------------------- | ------ |
| R1  | Base error class with `code`, `status`, `details`     | Done   |
| R2  | Subclasses for 7 common HTTP error categories         | Done   |
| R3  | `normalizeError()` handles all `unknown` input shapes | Done   |
| R4  | Generic `TDetails` support on normalized errors       | Done   |
| R5  | Optional `traceId`, `stack`, `mapDetails`             | Done   |
| R6  | `isAppError()` type guard                             | Done   |
| R7  | Zero external dependencies                            | Done   |

## Phases

| Phase | Description                                      | Status    |
| ----- | ------------------------------------------------ | --------- |
| 1     | BaseAppError + 7 subclasses + constants          | Completed |
| 2     | normalizeError with all input type branches      | Completed |
| 3     | Options: traceId, includeStack, mapDetails       | Completed |
| 4     | isAppError type guard                            | Completed |
| 5     | Refactor normalizeError into focused helper fns  | Completed |
| 6     | Full test coverage (null, undefined, mapDetails) | Completed |

## Test Plan

### BaseAppError subclasses

- ValidationError sets code=VALIDATION_ERROR, status=400
- NotFoundError sets code=NOT_FOUND, status=404
- UnauthorizedError sets code=UNAUTHORIZED, status=401
- ForbiddenError sets code=FORBIDDEN, status=403
- ConflictError sets code=CONFLICT, status=409
- RateLimitError sets code=RATE_LIMIT, status=429
- InternalError sets code=INTERNAL_ERROR, status=500

### normalizeError — input type dispatch

- BaseAppError preserves code, message, status, details
- Generic Error uses default code and status
- String input becomes message
- Object input becomes details
- null input returns default shape
- undefined input returns default shape

### normalizeError — options

- traceId attaches to result
- includeStack populates stack field
- mapDetails transforms object payload

### isAppError

- Returns true for BaseAppError subclasses
- Returns false for plain Error

## Decision Log

| #   | Question                   | Decision                                                          | Date       |
| --- | -------------------------- | ----------------------------------------------------------------- | ---------- |
| 1   | Error base class vs plain  | Class-based — enables `instanceof` checks and type guard          | --         |
| 2   | Subclass per HTTP category | Yes — 7 subclasses matching standard HTTP error codes             | --         |
| 3   | Generic TDetails           | Yes — consumers type their own details payloads                   | --         |
| 4   | External deps              | None — zero-dependency package                                    | --         |
| 5   | Refactor normalizeError    | Split into resolveErrorShape + attachMetadata + thin orchestrator | 2026-03-17 |

## Production Checklist

Use this checklist when evolving `@util/error-normalizer` for production:

- **Types and contracts**
  - `ErrorCode` and `NormalizedError` remain backwards compatible for consumers.
  - New error codes are added via `CORE_ERROR_CODES` / `CORE_ERROR_STATUS` and documented in the README.
  - Breaking changes to codes or behavior are treated as major-version changes.

- **Runtime behavior**
  - `BaseAppError` subclasses always set a code and status via the central constants.
  - `normalizeError()`:
    - Preserves `code`, `status`, and `details` for `BaseAppError` instances.
    - Applies sensible defaults for generic `Error` and non-error values.
    - Correctly propagates `traceId` and `stack` when requested.

- **Observability**
  - Log messages include the normalized error structure (not raw error objects).
  - Apps consistently pass a request or correlation ID into `normalizeError()` options where available.

- **Testing**
  - Unit tests cover all built-in error classes and `normalizeError` branches.
  - New error codes or behaviors include corresponding tests.

- **Documentation**
  - README includes:
    - End-to-end flow (domain → normalize → log → HTTP).
    - Examples for extending with app-specific error codes and types.
  - This plan file stays in sync with the actual behavior of the package.
