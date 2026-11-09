---
name: ax-skills-flutter-architecture
description: "Authoritative engineering standard for this Flutter app (BLoC + Cubit, feature-first clean architecture, web/iOS/Android). Use when scaffolding a feature, deciding Bloc vs Cubit, wiring DI/routing/networking, or when any other skill needs the canonical structure, theming, navigation, data, security, performance, i18n/a11y, error-handling, environments, or release rules. Triggers on new feature, new module, scaffold, project structure, where does this file go, bloc or cubit, how should we do X in Flutter."
metadata:
  version: "2.0"
---

# Flutter Engineering Standard (BLoC + Cubit)

The single source of truth for **how this app is built**: **Flutter**, **flutter_bloc (BLoC + Cubit)**, **feature-first clean architecture**, targeting **web, iOS, and Android**. Assumed libraries: `flutter_bloc`, `bloc_concurrency`, `go_router`, `dio` + `retrofit`, `freezed` + `json_serializable`, `equatable`, `get_it`-free DI (constructor injection), `intl`, `flutter_secure_storage`.

The spec workflow (`ax-skills-flutter-bootstrap`/`explore`/`propose`) decides *what* to build. This skill defines *how*. `ax-skills-flutter-planning` plans against it, `ax-skills-flutter-code-review` enforces it, and `ax-skills-flutter-testing` verifies it.

## Deep-dive references

This file is the summary. Load the matching helper for depth before doing focused work in that area:

| Area | Reference |
| --- | --- |
| **UI / design system — tokens, components, pages, Figma** | **skill `ax-skills-flutter-ui`** (owns all of `lib/design_system/`) |
| Bloc/Cubit code shapes, BlocObserver | [helpers/bloc-cubit-patterns.md](helpers/bloc-cubit-patterns.md) |
| Folder tree, flavors, dart-define, codegen, assets, lints | [helpers/project-structure-and-tooling.md](helpers/project-structure-and-tooling.md) |
| Responsive/adaptive layout & breakpoints (tokens/theme live in `ax-skills-flutter-ui`) | [helpers/theming-and-responsive.md](helpers/theming-and-responsive.md) |
| go_router, guards, web URLs, deep/universal/app links | [helpers/navigation-and-deep-linking.md](helpers/navigation-and-deep-linking.md) |
| dio/retrofit, error→Failure, Result, caching/offline | [helpers/networking-data-and-offline.md](helpers/networking-data-and-offline.md) |
| Failure taxonomy, logging, crash reporting, analytics | [helpers/error-handling-and-observability.md](helpers/error-handling-and-observability.md) |
| Secure storage, cert pinning, obfuscation, secrets | [helpers/security.md](helpers/security.md) |
| Rebuilds, lists, images, web renderer/deferred loading | [helpers/performance.md](helpers/performance.md) |
| intl/ARB, RTL, semantics, contrast, text scaling | [helpers/localization-and-accessibility.md](helpers/localization-and-accessibility.md) |
| Web hosting, TestFlight, Play, Codemagic/GHA, versioning | [helpers/ci-cd-and-release.md](helpers/ci-cd-and-release.md) |

## Folder layout

```
lib/
  main_dev.dart / main_stg.dart / main_prod.dart  # flavor entrypoints → bootstrap()
  bootstrap.dart            # runZonedGuarded, Bloc.observer, error hooks, runApp
  app/
    app.dart                # root MaterialApp.router, theme, global providers
    router.dart             # go_router config (routes, guards, redirects)
  core/
    config/                 # AppConfig / flavor + env (dart-define) values
    di/                     # composition root: build repositories + provide them
    error/                  # Failure types, exception → Failure mapping
    network/                # Dio client, interceptors, retrofit base
    observability/          # AppBlocObserver, logger, crash reporter
    storage/                # secure storage, key-value, local DB wrappers
    l10n/                   # generated localizations + ARB
    utils/                  # pure helpers, extensions, formatters
  design_system/            # THE design system — owned by ax-skills-flutter-ui
    tokens/                 # primitive + semantic tokens (ThemeExtensions)
    theme/                  # ThemeData light/dark/brand + context extensions
    components/             # atoms / molecules / organisms / templates
    gallery/                # widgetbook catalog of every component
  features/
    <feature>/
      data/                 # datasources (retrofit api + local), models (json), repositories impl
      domain/               # entities (pure Dart), repository contracts, usecases
      presentation/         # cubit/ | bloc/ (+ freezed state/events), pages/, widgets/
test/ ... integration_test/ ...
```

**Dependency rule (inward only):** `presentation → domain ← data`. Domain depends on nothing Flutter-/IO-specific. Presentation never imports a `*_model` or a data source — only domain entities, contracts, and use cases. Data implements domain contracts and maps models→entities.

## Bloc vs Cubit — how to choose

Default to **Cubit**. Reach for **Bloc** only when events earn their keep.

- **Cubit** (method-driven): simple-to-moderate state, direct calls (`load()`, `submit()`), no need for an event log. Most screens.
- **Bloc** (event-driven): serializable event log, complex/ordered transitions, event transformers (debounce/throttle/`restartable` via `bloc_concurrency`), or many input sources funneling into one state machine. E.g. search-as-you-type, multi-step wizards, real-time streams.

Record the choice + one-line justification in the spec and `docs/plan.md` (Decision Log). Canonical shapes: [helpers/bloc-cubit-patterns.md](helpers/bloc-cubit-patterns.md).

## State modeling (freezed)

- Model state as a **single immutable class with a status enum** (share data across statuses via `copyWith`) **or** a **sealed union** (disjoint data per state), via `freezed`.
- Standard statuses: `initial`, `loading`, `success`, `failure` (+ `refreshing`, `empty` where the UI needs them).
- Events (Bloc) are `freezed` unions. Never put mutable fields, `BuildContext`, or controllers in state. Equality comes from `freezed`/`equatable` — never compare by reference.

## Dependency injection (no service locator)

Inject via **constructor injection** wired at a **composition root** (`core/di`), surfaced with **`RepositoryProvider`/`BlocProvider`** — not a global service locator.

- `core/di` builds concrete repositories (with Dio/retrofit + local sources) once; `RepositoryProvider`s sit above the router.
- A page creates its bloc with `BlocProvider(create: (ctx) => XCubit(ctx.read<XRepository>())..load())`, **route-scoped** unless genuinely app-wide (e.g. `AuthCubit`).
- Cubits/Blocs receive **domain repository contracts**, never concrete impls or Dio.

## Navigation, networking, errors, security, performance, i18n/a11y

Summarized here; full rules in the helpers above.

- **Navigation:** one `GoRouter`; named-route constants; web path-URL strategy; every screen deep-linkable and refresh-safe; auth via `redirect` driven by `AuthCubit`, not widget checks.
- **Networking/data:** one configured `Dio` + interceptors; retrofit typed APIs; repositories map models→entities and wrap errors as `Failure`; return `Either<Failure, T>` (or a sealed `Result`) consistently; `DioException` never reaches presentation.
- **Errors/observability:** typed `Failure` taxonomy; global `AppBlocObserver`; `runZonedGuarded` + `FlutterError.onError` → crash reporter; structured logging, no `print`.
- **Security:** secrets via `--dart-define`/CI, never in source or VCS; credentials in `flutter_secure_storage`; validate deep-link/route params; release obfuscation; consider cert pinning for sensitive APIs.
- **Performance:** `const` everywhere possible; minimal rebuild scope (`buildWhen`, `context.select`); lazy lists (`ListView.builder`); cached/sized images; web deferred loading for heavy routes.
- **i18n/a11y:** all user-facing strings via `intl`/ARB (no hardcoded copy); support RTL; `Semantics`, sufficient contrast, and text-scaling resilience are requirements, not extras.
- **UI / design system:** all UI is built from `lib/design_system/` — semantic **tokens** (no raw colors/sizes), an Atomic-Design **component** library, and **page templates**. Feature pages compose templates + organisms and render bloc state through the shared state-view. This is owned by **`ax-skills-flutter-ui`**; load it before building any screen.

## Multiplatform rules (web / iOS / android)

- Keep `dart:io`, `dart:html`, and platform plugins out of `domain`/`presentation`. Guard platform code behind abstractions; use `kIsWeb`/`Platform` only in adapter/data/core layers; provide web fallbacks for plugins lacking web support.
- Build responsively off `LayoutBuilder`/`MediaQuery` breakpoints from `core/theme`, not device checks. One widget tree should serve mobile, tablet, and wide web where practical.
- Respect platform conventions: Android system back/predictive back, iOS edge-swipe + permissions (`Info.plist`), web title/URL/scroll/SEO. Declare per-platform divergence in the spec's **Platform and Build Targets** section.

## Naming conventions

- Files `snake_case.dart`; one primary public type per file named after the file.
- `*_cubit.dart`/`*_state.dart`; `*_bloc.dart`/`*_event.dart`/`*_state.dart`; `*_model.dart` (data); `*_repository.dart` (domain contract)/`*_repository_impl.dart` (data); pages end `_page.dart`.

## Scaffolding a new feature (checklist)

1. `domain/`: entity, abstract repository contract, use case(s).
2. `data/`: model(s) + (de)serialization, remote/local data source(s), repository impl mapping models→entities and errors→Failure.
3. `presentation/`: cubit-or-bloc (+ freezed state/events), page(s), widgets; states for initial/loading/success/failure/empty.
4. `app/router.dart`: add the route (+ guard) with a named constant; ensure web-refresh-safe.
5. `core/di`: build and provide the new repository.
6. `core/l10n`: add ARB keys for all new copy.
7. Tests: `bloc_test` for the cubit/bloc, widget test for the page's key states, golden where visual, integration for a critical flow (run `ax-skills-flutter-testing`).
8. Update `docs/plan.md` Decision Log (Bloc-vs-Cubit, route, data, platform choices).

## Rules (enforced by code-review)

- Inward dependency rule holds: no `*_model`/`dio`/data-source import in `presentation` or `domain`.
- No business logic in widgets; widgets render state and dispatch events/call methods only.
- No `BuildContext` stored in cubit/bloc; no `context` after an `await` without a `context.mounted` guard.
- Blocs/Cubits get domain contracts via constructor; no global singletons/service locator.
- `freezed` state, no mutable public fields; `const` constructors where possible.
- Every async path maps errors to `Failure`; UI renders a real error/empty state (no silent `catch`).
- No hardcoded user-facing strings (use `intl`/ARB); no hardcoded colors/sizes/text styles (use `lib/design_system` semantic tokens via `context.colors/spacing/text`).
- No one-off widget duplicating a design-system component; build screens from DS templates + components (see `ax-skills-flutter-ui`).
- No secrets in source/VCS; credentials only in secure storage; deep-link params validated.
- Platform-specific imports isolated; web fallbacks provided; responsive layout (not device branching) drives UI.
- Routes are deep-linkable and refresh-safe (especially on web).
