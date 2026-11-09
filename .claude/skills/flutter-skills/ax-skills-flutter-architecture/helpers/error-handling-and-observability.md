# Error Handling, Logging & Observability

A typed failure model, centralized logging, and crash reporting wired across all three platforms.

## Failure taxonomy

Domain-level errors are a `freezed` union (or sealed classes) in `core/error`. No raw exceptions cross into presentation.

```dart
@freezed
class Failure with _$Failure {
  const factory Failure.network() = NetworkFailure;          // no connectivity
  const factory Failure.timeout() = TimeoutFailure;
  const factory Failure.server({int? status, String? message}) = ServerFailure;
  const factory Failure.unauthorized() = UnauthorizedFailure;
  const factory Failure.notFound() = NotFoundFailure;
  const factory Failure.validation(Map<String, String> fields) = ValidationFailure;
  const factory Failure.serialization(String detail) = SerializationFailure;
  const factory Failure.unknown([String? detail]) = UnknownFailure;
}
```

- Map `DioException`/parse errors → `Failure` in the repository (`mapDioError`).
- The UI turns a `Failure` into a **user-facing message** (localized) + the right state (error view, inline field errors, retry). Never show raw exception strings to users.

## Logging

- One `AppLogger` in `core/observability`; structured levels (debug/info/warning/error). **No `print`** in app code (`avoid_print` lint).
- Strip verbose logs in release builds; never log tokens, passwords, or PII.

## Crash reporting & global handlers

Wire all error channels in `bootstrap()`:

```dart
FlutterError.onError = (details) {
  logger.error('FlutterError', details.exception, details.stack);
  crash.recordFlutterError(details);
};
PlatformDispatcher.instance.onError = (error, stack) {
  crash.recordError(error, stack, fatal: true);
  return true;
};
// plus runZonedGuarded(...) around runApp (see project-structure-and-tooling.md)
```

- Use Crashlytics or Sentry (Sentry has solid web + mobile support; Crashlytics is mobile-first — confirm web coverage). Record the choice in `docs/plan.md`.
- `AppBlocObserver.onError` forwards bloc errors to the same reporter (see bloc-cubit-patterns.md §7).

## Analytics (optional, if in scope)

- Funnel analytics through one `AnalyticsService` interface in `core/observability`; features depend on the interface, not the SDK.
- Emit events from blocs/use cases (intent), not from deep inside widgets. Respect consent and don't send PII.

## UI error/empty states

Every async screen must render: loading, **empty**, **error+retry**, and success. Provide reusable `ErrorView` / `EmptyView` in `core/widgets`. A silent `catch (_) {}` is a review-blocking `[high]` finding.
