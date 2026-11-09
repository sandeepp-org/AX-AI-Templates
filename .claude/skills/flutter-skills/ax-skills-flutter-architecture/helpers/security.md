# Security

Secrets, storage, transport, and platform hardening for web/iOS/Android.

## Secrets & configuration

- **Never** commit secrets, API keys, tokens, keystores, `google-services.json`/`GoogleService-Info.plist` with real values, or signing config.
- Inject config via `--dart-define`/`--dart-define-from-file` from CI secrets (see project-structure-and-tooling.md). Keep `env/*.json` untracked.
- Remember: anything shipped in the client binary/JS bundle is **not secret**. True secrets stay server-side; the app holds only what a user is authorized to hold.

## Credential storage

- Tokens and credentials go in **`flutter_secure_storage`** (Keychain / Keystore). On **web** it falls back to less-secure storage — prefer short-lived tokens, httpOnly cookies, or in-memory + silent refresh for web; document the tradeoff.
- Never persist secrets in `shared_preferences`, app state, logs, or analytics.

## Transport

- HTTPS only; reject mixed content on web.
- Consider **certificate pinning** for high-value APIs (configure on Dio's `HttpClientAdapter` for mobile; pinning is not available the same way on web — rely on platform TLS).
- Validate and sanitize **all external input**: deep-link/route params, query strings, web `postMessage`, pasted content. Treat them as untrusted before using in navigation, queries, or rendering.

## Auth

- Use OAuth2/OIDC or your backend's token scheme with short-lived access + refresh tokens.
- Refresh transparently in an interceptor; on hard 401, clear secure storage and route to login via the auth guard.
- Gate routes in `go_router` `redirect`, not in widgets.

## Platform hardening

- **Release builds:** obfuscate + strip — `flutter build ... --obfuscate --split-debug-info=build/symbols` (mobile). Keep symbol files to de-obfuscate crash reports.
- **Android:** set `minifyEnabled`/`shrinkResources` (R8) with proper ProGuard rules; least-privilege permissions in the manifest.
- **iOS:** least-privilege usage descriptions in `Info.plist`; enable App Transport Security.
- **Web:** set a Content-Security-Policy and security headers at the host; avoid `dart:html` injection of untrusted HTML; beware `dart:js`/iframe interop with untrusted content.
- Biometric/local-auth (`local_auth`) for sensitive actions where the spec calls for it.

## Review hooks

Hardcoded secret, token in logs, unvalidated deep-link param, missing release obfuscation, or credentials in non-secure storage are `[high]` findings in `ax-skills-flutter-code-review` (`security` category).
