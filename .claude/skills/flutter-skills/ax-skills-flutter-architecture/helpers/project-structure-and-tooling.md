# Project Structure, Flavors & Tooling

Setup conventions for the app. Pairs with the folder layout in `SKILL.md`.

## Entry points & bootstrap

One thin entry per flavor; all shared startup lives in `bootstrap()`.

```dart
// main_prod.dart
void main() => bootstrap(AppConfig.prod);

// bootstrap.dart
Future<void> bootstrap(AppConfig config) async {
  WidgetsFlutterBinding.ensureInitialized();
  final logger = AppLogger();
  final crash = CrashReporter();
  Bloc.observer = AppBlocObserver(logger);
  FlutterError.onError = crash.recordFlutterError;
  await runZonedGuarded(
    () async {
      final deps = await buildDependencies(config); // core/di
      runApp(App(deps: deps, config: config));
    },
    (error, stack) => crash.recordError(error, stack, fatal: true),
  );
}
```

## Flavors / environments

Three flavors: `dev`, `stg`, `prod`. Encode environment in `AppConfig`, fed by `--dart-define` (never hardcode secrets/URLs).

```dart
// core/config/app_config.dart
class AppConfig {
  const AppConfig({required this.flavor, required this.apiBaseUrl});
  final Flavor flavor;
  final String apiBaseUrl;

  static const prod = AppConfig(flavor: Flavor.prod, apiBaseUrl: String.fromEnvironment('API_BASE_URL'));
}
```

Run/build with a dart-define file:

```
flutter run --flavor dev -t lib/main_dev.dart --dart-define-from-file=env/dev.json
flutter build apk --flavor prod -t lib/main_prod.dart --dart-define-from-file=env/prod.json
```

- **Android:** `productFlavors` in `android/app/build.gradle` (applicationId suffixes per flavor).
- **iOS:** Xcode schemes/configurations per flavor.
- **Web:** flavor via the chosen entrypoint + dart-define; deploy targets per environment.
- Keep `env/*.json` untracked (commit `env/example.json`); inject real values from CI secrets.

## Code generation (build_runner)

`freezed`, `json_serializable`, `retrofit`, and l10n all generate code. Conventions:

- Regenerate with `dart run build_runner build --delete-conflicting-outputs`; watch during dev with `... watch`.
- Commit generated `*.g.dart` / `*.freezed.dart` (be consistent with the repo's existing choice).
- Never hand-edit generated files. Keep `part` directives correct (`part 'x.freezed.dart';`, `part 'x.g.dart';`).
- Generation must be current before commit (see `ax-skills-flutter-commit-policy`).

## Dart & Flutter MCP server (agent feedback loop)

Register the first-party Dart & Flutter MCP server so coding agents get a structured, self-correcting feedback loop into the toolchain — analyze/test/format/codegen with machine-readable diagnostics, pub.dev search + dependency management, symbol/docs resolution, and **introspection of the running app** (widget tree + live runtime errors).

```
# one-time, in the app repo (requires Dart 3.9+)
claude mcp add --transport stdio dart -- dart mcp-server
```

The skill suite prefers these MCP tools over raw CLI when the server is present; see `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml` for the capability→CLI mapping and the `prefer_over_cli` flag. The `commit-policy`, `testing`, and `code-review` skills consume it. CLI commands below remain the fallback when the server is not registered.

## Static analysis & lints

- `analysis_options.yaml` includes a strict rule set (e.g. `flutter_lints` or `very_good_analysis`) plus project rules.
- Treat analyzer warnings as errors in CI. Recommended toggles: `prefer_const_constructors`, `require_trailing_commas`, `avoid_print`, `unawaited_futures`, `use_build_context_synchronously`.
- Exclude generated files from some lints but not from the analyzer.

## Assets & fonts

- Declare assets/fonts in `pubspec.yaml`; organize under `assets/{images,icons,fonts}/`.
- Provide resolution variants (`2.0x/`, `3.0x/`) for raster images; prefer SVG (`flutter_svg`) or vector icons where possible.
- For web, mind initial bundle size — defer large assets and avoid shipping unused fonts.

## Dependency hygiene

- Pin versions thoughtfully; run `flutter pub outdated` periodically.
- Keep `pubspec.yaml` grouped (state, routing, network, codegen, dev_dependencies) with comments.
- Every added package must have a justification recorded in `docs/plan.md` Decision Log (size, platform support across web/iOS/Android, maintenance).
