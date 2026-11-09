---
name: ax-skills-flutter-verify
description: "Runtime verification for the Flutter (BLoC + Cubit) app — launches/attaches the running app via the Dart & Flutter MCP server, drives to the changed screen/flow, and introspects the live widget tree + runtime errors to confirm a change actually renders and behaves before code review or commit. Use after implementing a change or phase, or when asked to verify it works. Triggers on verify, does it work, check it runs, did it render, runtime check, confirm the fix, before commit."
metadata:
  version: "1.0"
---

# Flutter Runtime Verification (BLoC + Cubit)

The runtime layer above static checks. After a change is implemented and `analyze`/`run_tests` are green, this skill **runs the real app**, drives to the affected screen/flow, and inspects the live widget tree and runtime-error stream to confirm the change renders and behaves as the plan and spec require — before `ax-skills-flutter-code-review` and `ax-skills-flutter-commit-policy`. It closes the loop your static tools can't: a green analyzer and passing widget tests do not prove the screen actually renders without overflow, navigates correctly, or stays free of runtime exceptions on a target platform.

## Tooling

This skill depends on the **Dart & Flutter MCP server** — its `runtime_introspect` capability (running-app widget tree + live runtime errors) is **MCP-only** with no CLI equivalent (see `mcp_only` in `.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`).

- **runtime_introspect** — launch or attach to the running app, read the widget tree, navigate, exercise behavior, and read the live runtime-error stream. Hot-reload after a fix and re-inspect to iterate in place.
- **analyze** / **run_tests** — confirm the static gate is green before running (don't verify a build that doesn't compile).
- **resolve_symbol** — confirm the real shape of a state/widget when the tree doesn't match expectations.

One-time setup in the app repo (requires Dart 3.9+): `claude mcp add --transport stdio dart -- dart mcp-server`.

**If the server is not registered:** runtime introspection is unavailable — say so explicitly rather than reporting a pass. Either ask the user to register it, or fall back to the manual path: `flutter run` on a target and/or `flutter test integration_test` for the touched flow, and report that verification was manual/partial.

## Trigger

- `"verify feature-<name>"` — verify the affected screens/flows of that module
- `"verify phase <N>"` — verify only that phase's deliverables (scope to `docs/plan.md`)
- `"does it work"` / `"check it runs"` / `"confirm the fix"` — verify the change just made
- Automatically as the **runtime step** of the planning execution pipeline and each phase review gate (see `ax-skills-flutter-planning`), and before commit when a change touches UI or user-facing behavior.

## Preconditions

1. The static gate is green: **analyze** clean and **run_tests** passing (commit-policy / planning pipeline). Verification is the runtime layer *on top of* static checks, not a replacement.
2. There is a defined expectation to verify — plan acceptance criteria (`docs/plan.md`), spec per-platform behavior (`ax-flutter-sdd-artifacts/specs/`), or the explicit behavior the user described. If no expectation is stated, ask what "working" means before running.

## Procedure

For the change or phase being verified:

1. **Scope it.** From `docs/plan.md` (phase deliverables + acceptance checks) and the relevant atomic spec, list exactly what must be observable: which route/screen, which bloc/cubit states, which navigation/guards, which per-platform behavior.

2. **Launch or attach** the app via **runtime_introspect**, preferring the fastest target first (web), then a mobile target when the change has platform-specific behavior. Reuse a running instance if one is attached.

3. **Drive to the change.** Navigate to the affected route (exercise deep-link/refresh on web where the spec requires it) and trigger the changed behavior (tap, submit, pull-to-refresh, etc.).

4. **Inspect the live widget tree** against the expectation:
   - The correct view renders for **each bloc/cubit state** the change touches — loading, success, empty, **error/retry** (force the failure path, don't only check the happy path).
   - No layout errors (overflow, unbounded constraints) on the affected screens.
   - Navigation/guards behave: redirects fire, back/close works, web URL is correct and refresh-safe.
   - Responsive layout holds at the spec's breakpoints; platform divergence (web/iOS/Android) matches the spec.

5. **Read the live runtime-error stream** while exercising the flow: zero unhandled exceptions, no red error screens, no assertion failures, no thrown `FlutterError`. A runtime exception is a verification failure even if the UI looks right.

6. **Iterate in place** on any failure: fix, **hot-reload**, re-inspect — don't restart from scratch. Re-run the touched `run_tests` after a code fix.

7. **Record the outcome** to `docs/verify.md` for the module (template below): Pass or Fail per checked item, with concrete evidence (widget-tree facts, runtime-error text, route/URL, target platform). Never report a pass without having actually observed the tree/flow.

## What to check (by change type)

| Change touches | Verify at runtime |
| --- | --- |
| A cubit/bloc state | Each state's view renders live (incl. forced failure + empty); no `emit`-after-close or stuck-loading in the error stream |
| A screen / widget | Renders without overflow across the spec's breakpoints; interactions dispatch and update the tree; a11y (focus/labels) present |
| Navigation / a route | Route reachable; guard/redirect fires; deep-link + browser refresh land correctly on web; back/close behaves |
| Networking / data | Loading→success and loading→**failure** both reach the right UI state; retry works; no `DioException` in the runtime stream |
| Platform-specific code | Behavior confirmed on the affected platform(s), not just the default target |
| Design-system / theme | Tokens applied live (light/dark/brand); no raw-literal regressions visible; component states render |

## docs/verify.md template

```markdown
# Runtime Verification — feature/<name>

Last verified: <ISO date> — target(s): <web | ios | android>

## Verified

- [x] <route/screen> renders <state> correctly — <evidence: widget-tree fact / URL> — <target>
- [x] failure path shows ErrorView + retry — no runtime exception in stream — web

## Failures

- [ ] [high] <what was expected vs observed> — `<route/state>` — <runtime-error text> — <target>

## Not verifiable

- <item> — Dart MCP server not registered / no device for <platform>; verified manually via <flutter run | integration_test> or NOT verified
```

## Definition of done (verification)

- [ ] Static gate confirmed green (analyze clean, run_tests passing) before running.
- [ ] App launched/attached and driven to every affected route/flow on at least the fastest target.
- [ ] Every touched bloc/cubit state observed live, **including the forced failure and empty paths**.
- [ ] No overflow/layout errors and no unhandled runtime exceptions in the live error stream.
- [ ] Platform-specific and web refresh/deep-link behavior checked where the spec requires it.
- [ ] `docs/verify.md` updated with Pass/Fail and concrete evidence; anything not verifiable is named explicitly (never silently passed).
