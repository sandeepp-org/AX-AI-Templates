---
name: ax-skills-flutter-code-review
description: On-demand code review for the Flutter (BLoC + Cubit) app. Reviews a feature module or the whole app against the engineering standard and 16 categories, then writes/updates docs/review.md per module with open issues and completed items. Use when the user asks to review a feature, module, or the codebase.
metadata:
  version: "1.0"
---

# Flutter Code Review (BLoC + Cubit)

On-demand review of feature modules and the app. Checks Dart/Flutter code against the project rules (see `ax-skills-flutter-architecture`) and writes findings to `docs/review.md` inside each reviewed module.

## Tooling

When the **Dart & Flutter MCP server** is registered (see `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`), use it to ground findings instead of eyeballing:

- **analyze** — pull the structured analyzer diagnostics for the scope; every reported issue is a finding (don't re-derive them by reading).
- **resolve_symbol** — resolve actual signatures, types, and docs for a symbol before flagging a `logic`, `bloc`, `architecture`, or `network` issue, so the finding cites the real contract rather than a guess. This is the symbol-level precision an LSP would give you.

Findings from `analyze` carry an exact `file:line` already — record them verbatim. If the server is not registered, fall back to reading the files and `flutter analyze` output.

This skill reviews the **static** code. Its runtime complement is `ax-skills-flutter-verify`, which runs the app and confirms the change actually renders and behaves — pair them on any UI/behavior change.

## Trigger

- `"review the codebase"` — review all modules under `lib/features/` plus `lib/core` and `lib/app`
- `"review feature-<name>"` — review only `lib/features/<name>`
- `"review feature-<name> phase <N>"` — review only what was built in that phase (scope to phase deliverables in `docs/plan.md`)

Run after every phase, not only at the end of a module. Each phase review catches problems early before the next phase builds on top of them.

## Verifier-first (when used after plan approval)

If this skill runs **after** a verifier pass (plan acceptance checks + `flutter analyze` + `flutter test`), treat that work as done. Apply the categories below with **scoping** — prioritize **[high]** and acceptance-path **[med]**; in delivery mode do not expand into open-ended style hunts unless the approved plan requires a full pass. For user-triggered reviews (`"review feature-*"`, codebase-wide), the full procedure applies unless the user narrows scope.

## Procedure

For each module being reviewed:

1. **Read** these in order:
   - `lib/features/<name>/**/*.dart` (data, domain, presentation + their tests under `test/features/<name>/`)
   - `docs/plan.md` (this module's plan + Decision Log)
   - `pubspec.yaml` and `analysis_options.yaml` (lints in effect)
   - relevant `lib/core` pieces the module uses (router, di, network, error)
   - the MCP **analyze** diagnostics for the scope (if the server is registered) — seed Open Issues from these before manual review

2. **Check** every file against all 16 categories below (the categories mirror the standards in `ax-skills-flutter-architecture`, `ax-skills-flutter-ui`, and their `helpers/`). Flag **everything** — no finding is too small. For each finding record:
   - A short description of the problem
   - The exact file path and line (`lib/features/auth/presentation/cubit/auth_cubit.dart:42`)
   - The category label
   - A severity prefix: `[high]`, `[med]`, or `[low]`

3. **Write/update** `docs/review.md` for the module (e.g. `docs/review-<name>.md`, or `lib/features/<name>/docs/review.md` if you keep per-module docs):
   - If it does not exist, create it from the template below
   - If it exists, append new findings to **Open Issues** — do not remove existing entries
   - If a previously open issue is now fixed in current code, move it to **Completed**

4. For shared layers (`lib/core`, `lib/app`): same procedure, writes to `docs/review-core.md`.

---

## docs/review.md template

```markdown
# Review — feature/<name>

Last reviewed: <ISO date>

## Open Issues

- [ ] <short description> — `<file>:<line>` — [category-label]

## Completed

- [x] <short description> — resolved <date or PR>
```

**Rules for maintaining review.md:**

- Append new findings under **Open Issues** — never overwrite or reorder existing items
- When an issue is verified fixed, move it (do not delete) to **Completed** with a resolved date
- Completed items are permanent history — never delete them
- Every item must have a `file:line` reference and a category label

---

## Review categories

Check every source and test file against all 16 categories. Flag every violation, no matter how small.

| Category | Label | What to flag |
| --- | --- | --- |
| Dart/Flutter style | `style` | Missing `const` constructors/widgets, non-final fields that could be final, hardcoded strings/numbers (use constants/theme tokens), giant `build()` methods that should split into widgets, business logic in `build`, `print` instead of a logger, unused imports, emojis in code |
| Widget test coverage | `test-coverage` | Missing tests for: each cubit/bloc state (initial/loading/success/failure/empty), error paths, empty/long lists, retry, key widget states (golden), navigation/guard behavior, edge inputs; missing `bloc_test` for a bloc/cubit |
| Logic issues | `logic` | Missing null/empty guards, unawaited Futures, `emit` after close, missing `mounted`/`context.mounted` guard after `await`, race conditions from overlapping events, wrong state transitions, silent failures (`catch (_) {}`) |
| BLoC/Cubit design | `bloc` | Business logic in widgets instead of cubit/bloc; mutable state or `BuildContext`/controllers stored in state; Bloc used where a Cubit suffices (or vice-versa) without justification; side effects (nav/snackbar) in `build` instead of `BlocListener`; non-`freezed`/non-equatable state compared incorrectly; `emit` called from outside the bloc |
| Architecture & layering | `architecture` | Presentation importing `*_model` or a data source; `domain` importing Flutter/dio/json; data not mapping models→entities; use case/repository contract bypassed; file in the wrong layer/folder; feature reaching into another feature's internals instead of `core` |
| Resource management | `resource` | `StreamSubscription`/`AnimationController`/`TextEditingController`/`FocusNode` not disposed; `BlocProvider`/bloc not closed when manually created; no timeout on Dio calls; listeners not removed; image/stream leaks |
| Dependency injection | `di` | Cubit/Bloc constructing its own repository or Dio instead of receiving a domain contract; global singletons/service locator; bloc provided app-wide when route-scoped is correct; concrete impl injected where the contract should be |
| Security | `security` | Secrets/API keys hardcoded in source or committed; tokens/PII written to logs; `flutter_secure_storage` not used for credentials; missing TLS/cert handling; unvalidated deep-link/route params used directly; debug-only code shipped |
| Navigation & platform | `platform` | Route not deep-linkable/refresh-safe on web; hardcoded route strings instead of named constants; auth check in widget instead of router `redirect`; `dart:io`/`dart:html`/plugin used without web guard or fallback; device-type branching instead of responsive breakpoints; missing per-platform handling (Android back, iOS permissions, web URL strategy) |
| Networking & errors | `network` | `DioException` leaking into presentation; errors not mapped to `Failure`; no error/empty UI state; missing retry/timeout handling; models not `json_serializable`; manual JSON parsing that should be generated |
| Performance | `perf` | Missing `const`; whole-screen rebuilds where `buildWhen`/`context.select` would scope it; `Column` of many children instead of `ListView.builder`; unsized/uncached network images; heavy work in `build` or on the UI thread (no `compute`); no `deferred` import for heavy web routes; controllers allocated in `build` |
| Observability | `observability` | `print` instead of logger; tokens/PII in logs; no global error handlers (`FlutterError.onError`/`runZonedGuarded`/`AppBlocObserver`); silent `catch`; errors not surfaced to crash reporter; analytics SDK referenced directly in widgets instead of via a `core` interface |
| Localization & a11y | `a11y-i18n` | Hardcoded user-facing strings instead of intl/ARB; manual date/number/currency formatting; hardcoded `left`/`right` instead of directional (RTL); missing `Semantics`/labels; insufficient contrast; layout breaks under text scaling; tap targets < 48dp; no keyboard/focus support on web |
| Design system | `ds` | Raw color/size/text-style/duration literals instead of semantic tokens (`context.colors/spacing/text`); reaching for raw `Container`/`Text`/`ElevatedButton` where a DS atom exists; a one-off widget duplicating an existing DS component; a DS component carrying bloc/repository/navigation/business logic; interactive component missing default/hover/focus/pressed/disabled/loading; new/changed component without a gallery entry or golden test; page hand-rolling layout/`MediaQuery` instead of using a DS template + state-view; Figma values approximated instead of imported as tokens/components |
| Docs completeness | `docs` | `docs/plan.md` missing `## Test Plan`, README missing module overview/route table, missing Decision Log entry for Bloc-vs-Cubit choice, SKILL/architecture rules not referenced where deviated, feature `CLAUDE.md` missing or stale (routes/contracts/state/Bloc-vs-Cubit out of sync with the code) |
| Project invariants | `invariant` | Folder not `lib/features/<name>/{data,domain,presentation}`; bloc/cubit/state/model file naming off-convention; raw `Dio`/`http` used in a widget instead of repository; env/config read inside a feature instead of `core`; presentation depending on data layer past the domain contract |

---

## Severity guide

- `[high]` — security issue, data loss/leak, resource leak, broken layering invariant, crash path, web route that breaks on refresh
- `[med]` — logic bug, missing test for a critical path, Bloc/Cubit design issue, unmapped error
- `[low]` — style violation, missing `const`, minor docs gap

Example:

```markdown
## Open Issues

- [ ] [high] DioException leaks to ProfilePage; no error state — `lib/features/profile/data/repositories/profile_repository_impl.dart:31` — [network]
- [ ] [high] StreamSubscription never cancelled in close() — `lib/features/feed/presentation/bloc/feed_bloc.dart:58` — [resource]
- [ ] [med] No bloc_test for failure transition — `test/features/profile/profile_cubit_test.dart` — [test-coverage]
- [ ] [low] Widget missing const constructor — `lib/features/profile/presentation/widgets/profile_view.dart:12` — [style]
```

---

## Summary checklist (run mentally before writing review.md)

- [ ] Checked all source files for style, logic, bloc, architecture, resource, di, security, platform, network, perf, observability, a11y-i18n, ds
- [ ] Verified inward dependency rule (presentation → domain ← data) holds with no leaks
- [ ] Verified every cubit/bloc state has test coverage incl. failure + empty paths
- [ ] Checked routes are deep-linkable and refresh-safe on web; platform divergence handled
- [ ] Checked secrets are not hardcoded and tokens are not logged; global error handlers wired
- [ ] Checked rebuild scope, list/image perf, and web bundle/deferred loading
- [ ] Checked user-facing strings are localized (intl/ARB) and screens meet a11y (semantics, contrast, text scaling, tap targets)
- [ ] Checked design-system compliance: tokens (no raw literals), DS component reuse, components are logic-free with full states, screens use DS templates + state-view, goldens/gallery updated
- [ ] Checked folder/naming follows `lib/features/<name>/{data,domain,presentation}`
- [ ] Checked `docs/plan.md` has a Test Plan and a Decision Log entry for Bloc-vs-Cubit
- [ ] Assigned severity to every finding
- [ ] Moved any previously open issues now fixed to Completed
