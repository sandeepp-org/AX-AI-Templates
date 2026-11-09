# Networking, Data & Offline

dio + retrofit in the data layer, clean error mapping, and a consistent caching/offline strategy.

## Dio client & interceptors

One configured `Dio` in `core/network`, reused everywhere.

```dart
Dio buildDio(AppConfig config, AuthTokenStore tokens) {
  final dio = Dio(BaseOptions(
    baseUrl: config.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
  ));
  dio.interceptors.addAll([
    AuthInterceptor(tokens),          // attach + refresh tokens
    RetryInterceptor(),               // idempotent retries w/ backoff
    if (config.flavor != Flavor.prod) LogInterceptor(responseBody: true),
  ]);
  return dio;
}
```

- Always set timeouts. Never log request/response bodies in prod (PII/secrets).
- Token refresh: queue concurrent 401s, refresh once, retry — don't stampede.

## Retrofit API + models

- Typed endpoints via retrofit (`@RestApi`); request/response bodies are `*_model` classes with `json_serializable`.
- Models live in `data/models`; they **never** leave the data layer — repositories map them to **domain entities**.

## Error mapping → Failure

`DioException` (and parsing errors) are caught in the repository and mapped to a typed `Failure`; presentation only ever sees `Failure`. See `helpers/error-handling-and-observability.md` for the taxonomy.

```dart
Future<Either<Failure, Profile>> getProfile() async {
  try {
    return Right((await _api.fetchProfile()).toEntity());
  } on DioException catch (e) {
    return Left(mapDioError(e));     // network/timeout/server/unauthorized/...
  } on FormatException catch (e) {
    return Left(SerializationFailure(e.toString()));
  }
}
```

Pick **one** result type (`Either<Failure, T>` via dartz, or a sealed `Result`) and use it across all repositories.

## Caching, persistence & offline

Choose storage per need (record the choice in `docs/plan.md`):

- **Key-value / prefs:** `shared_preferences` (non-sensitive flags, last route).
- **Secure:** `flutter_secure_storage` (tokens, credentials).
- **Structured local DB / cache:** `drift` (SQL, relational, reactive) or `hive`/`isar` (fast KV/object). Use one consistently.

Offline-first repository pattern:

```dart
// 1. emit cached → 2. fetch remote → 3. update cache → 4. emit fresh (or keep cache on failure)
```

- Cache invalidation strategy must be explicit (TTL, version, manual). Don't silently serve stale data without a `refreshing` state.
- Detect connectivity (`connectivity_plus`) to short-circuit and show offline UI; queue mutations where the UX requires it.
- All three platforms: web has no SQLite by default — use a web-compatible backend (drift wasm / IndexedDB-backed) or guard local-DB code with a web fallback.

## Pagination

Expose page/cursor params in the repository; in the bloc keep `items + hasMore + isLoadingMore`; use a `Bloc` with a `restartable`/`droppable` transformer for load-more to avoid duplicate pages.
