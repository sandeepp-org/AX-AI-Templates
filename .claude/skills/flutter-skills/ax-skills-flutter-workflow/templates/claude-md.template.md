<!--
Layered CLAUDE.md template for the Flutter app. Two shapes:

  1. ROOT — one file at the app root (or repo root). The big picture only.
  2. FEATURE — one file per `lib/features/<name>/`. Local conventions only.

Claude loads these ADDITIVELY as it moves through the tree: the root file for
the overview, then the nearest feature file for local rules. So:

  - Keep both LEAN. A CLAUDE.md is not documentation — it is the few things an
    agent must know that it cannot infer from the code in front of it.
  - DO NOT restate the engineering standard. Point to the skills
    (`ax-skills-flutter-architecture`, `ax-skills-flutter-ui`) instead.
  - DO NOT duplicate the root file in feature files. Only what is local.
  - If a line is obvious from the code or already in a skill, delete it.

Copy the block you need, fill the <…> placeholders, drop the comments.
-->

<!-- ============================ ROOT CLAUDE.md ============================ -->
<!-- Path: ./CLAUDE.md (app root). Generated/refreshed by ax-skills-flutter-bootstrap. -->

# <App name>

<One sentence: what this app does and for whom.>

**Stack:** Flutter (web / iOS / Android) · BLoC + Cubit (flutter_bloc) · feature-first clean architecture.

## Where things live

- `lib/features/<name>/{data,domain,presentation}` — feature modules. **Each feature has its own `CLAUDE.md`** with local conventions; read it before editing that feature.
- `lib/core/` — shared DI, routing, networking, error handling, config.
- `lib/design_system/` — tokens, theme, Atomic-Design components (see `ax-skills-flutter-ui`).

## Standards (don't restate — follow the skills)

- Architecture, Bloc-vs-Cubit, DI, navigation, networking, security, perf, i18n/a11y → **`ax-skills-flutter-architecture`** (+ its `helpers/`).
- UI, design tokens, components, Figma-to-code → **`ax-skills-flutter-ui`**.
- Plan before code → `ax-skills-flutter-planning`; tests → `ax-skills-flutter-testing`; runtime check → `ax-skills-flutter-verify`; review → `ax-skills-flutter-code-review`; commits → `ax-skills-flutter-commit-policy`.

## Commands

Prefer the Dart & Flutter MCP server (`analyze` / `run_tests` / `format`) when registered; CLI fallback below. See `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`.

- Format: `dart format .`
- Analyze: `flutter analyze`
- Test: `flutter test` · coverage: `flutter test --coverage`
- Codegen: `dart run build_runner build --delete-conflicting-outputs`
- Run: `flutter run --flavor <dev|stg|prod> -t lib/main_<flavor>.dart --dart-define-from-file=env/<flavor>.json`

## Project-wide conventions

<Only globally-true, non-obvious rules. e.g. "generated *.g.dart/*.freezed.dart are committed"; "no service locator — constructor DI only"; "user-facing strings are localized (intl/ARB)". Delete anything already enforced by a skill or lint.>

<!-- Last reviewed: <ISO date> — re-check when the model or stack changes; stale guidance constrains newer models. -->


<!-- =========================== FEATURE CLAUDE.md ========================== -->
<!-- Path: lib/features/<name>/CLAUDE.md. Generated/refreshed by ax-skills-flutter-planning. -->

# feature/<name>

<One sentence: what this feature does.>

## Local conventions

- **State:** <Cubit|Bloc> `<XCubit>` — chosen because <one line>. Full reasoning in `docs/plan.md` Decision Log.
- **Routes owned:** `<route-name>` → `<path>` (<guarded? deep-link/refresh behavior on web>).
- **Contracts:** `<XRepository>.<method>(...) : Either<Failure, T>` — implemented in `data/`, mocked at the domain boundary in tests.
- **State shape:** `<XState>` statuses: <loading|success|empty|failure …>.
- **Platform divergence:** <web / iOS / Android specifics, if any — else "none">.

## Deviations from the standard

<Anything this feature does differently from `ax-skills-flutter-architecture`/`-ui`, with the reason. If none, write "none — follows the standard." Do NOT repeat the standard here.>

## Docs

- Plan: `docs/plan.md` · Review: `docs/review.md` · Verify: `docs/verify.md`
