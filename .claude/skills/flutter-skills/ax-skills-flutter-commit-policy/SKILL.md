---
name: ax-skills-flutter-commit-policy
description: "Use when preparing a commit, opening a PR, or finalizing staged changes in the Flutter app. Enforces commit format, scope, and pre-commit hygiene (dart format, flutter analyze, flutter test, build_runner up to date). Triggers on commit, PR, push, ship it, finalize, wrap up."
---

# Flutter Commit Policy Skill

Use when preparing commits or PR-ready changes for the Flutter (BLoC + Cubit) app.

## Tooling

Prefer the **Dart & Flutter MCP server** for `format`, `analyze`, `codegen`, and `run_tests` — it returns structured diagnostics you can act on directly, which turns each check below into a fix-and-recheck loop instead of grepping CLI text. Fall back to the CLI command only when the server is not registered. The capability→CLI mapping and the `prefer_over_cli` flag live in `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`. (One-time setup: `claude mcp add --transport stdio dart -- dart mcp-server`.)

## Pre-commit checks (run before proposing completion)

Run, in order, and fix failures before committing. Each step names the MCP capability first, with the CLI fallback in parentheses:

1. **format** (`dart format .`, or `dart format --set-exit-if-changed .` in CI) — formatting is clean.
2. **analyze** (`flutter analyze`) — zero errors and zero new warnings; iterate on the structured diagnostics until clean.
3. If using `freezed`/`json_serializable`/`retrofit`: generated files are current — **codegen** (`dart run build_runner build --delete-conflicting-outputs`) and commit the regenerated `*.g.dart` / `*.freezed.dart`.
4. **run_tests** (`flutter test`) — all unit/widget/bloc tests pass; add tests for new cubit/bloc states and changed behavior.
5. For critical flows touched: `flutter test integration_test` on at least one target platform.
6. Sanity-build the platforms you touched when build config changed: `flutter build web` / `flutter build apk --debug` / `flutter build ios --no-codesign`.
7. For changes touching UI or user-facing behavior: runtime verification has passed via `ax-skills-flutter-verify` (the app was run and the affected screens/states/navigation observed, incl. the failure path) — static checks alone are not sufficient to mark such a change done.

## Rules

- Never commit secrets, API keys, keystores, `*.jks`, `google-services.json` / `GoogleService-Info.plist` with real credentials, or signing config. Keep them out of source and in CI secrets / untracked config.
- Do not commit `build/`, `.dart_tool/`, or platform ephemeral dirs; **do** commit generated `*.g.dart` / `*.freezed.dart` if the project's convention checks them in (be consistent with the repo).
- Keep commits scoped to one logical change (prefer one feature module or one layer per commit).
- Use message text that explains **why**, not only what. Conventional-commit style with a module scope reads well: `feat(auth): biometric login cubit`, `fix(feed): cancel stale search on requery`.
- Run the relevant checks above before proposing completion; state which passed and paste failures.
- Do not amend or force-push unless explicitly requested.
- When a commit changes a route, public repository contract, or Bloc-vs-Cubit decision, update `docs/plan.md` (Decision Log), the module README, and the feature `lib/features/<name>/CLAUDE.md` in the same commit.
