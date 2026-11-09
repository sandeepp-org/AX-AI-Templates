---
name: code-review
description: On-demand code review agent. Reviews packages or the full codebase against all project rules and skills, then writes/updates docs/review.md per package with open issues and completed items across 11 categories. Use when the user asks to review a package or the codebase.
metadata:
  version: "1.0"
---

# Code Review

On-demand review of packages and the app. Checks code against all project rules and skills, then writes findings to `docs/review.md` inside each reviewed package.

## Trigger

- `"review the codebase"` — review all packages under `packages/` plus the app
- `"review util-<name>"` — review only that specific package

Run after the package is implementation-complete and again before opening a PR.

## Procedure

For each package being reviewed:

1. **Read** these files in order:
   - `packages/<name>/src/**/*.ts` (all source + test files)
   - `packages/<name>/SKILL.md` (the package's own Rules section)
   - `packages/<name>/README.md`

2. **Check** every file against all 11 categories in the table below. Flag **everything** — no finding is too small to record. A missing comment is as worth flagging as a security issue; severity separates them, not the decision to skip. For each finding record:
   - A short description of the problem
   - The exact file path and line number (`src/logger.ts:42`)
   - The category label
   - A severity prefix: `[high]`, `[med]`, or `[low]`

3. **Write/update** `packages/<name>/docs/review.md`:
   - If the file does not exist, create it from the template below
   - If it exists, append new findings to **Open Issues** — do not remove existing entries
   - If a previously open issue is now fixed in the current code, move it to **Completed**

4. For the app (`app/`): same procedure, writes to `app/docs/review.md`

---

## docs/review.md template

Create this file if it does not exist:

```markdown
# Review — @util/<name>

Last reviewed: <ISO date>

## Open Issues

- [ ] <short description> — `<file>:<line>` — [category-label]

## Completed

- [x] <short description> — resolved <date or PR>
```

**Rules for maintaining review.md:**

- Append new findings under **Open Issues** — never overwrite or reorder existing items
- When an issue is verified fixed in the current code, move it (do not delete) to **Completed** with a resolved date
- Completed items are permanent history — never delete them
- Every item must have a `file:line` reference and a category label

---

## Review categories

Check every source file and test file against all 11 categories. Flag every violation found, no matter how small.

| Category             | Label           | What to flag                                                                                                                                                                                                                 |
| -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code style           | `style`         | Non-arrow functions, nested functions, hardcoded values (use constants), business logic inside class body (put in helpers), emojis in code                                                                                   |
| Edge case coverage   | `test-coverage` | Missing tests for: null/undefined input, empty array/string, concurrent calls, error paths, reinit after close(), boundary values, invalid config                                                                            |
| Logic issues         | `logic`         | Missing null/undefined guards, unhandled promise rejections, missing await, race conditions (shared mutable state), incorrect error propagation, silent failures                                                             |
| Design issues        | `design`        | Business logic in class methods (should be in standalone helper functions), functions longer than ~20 lines, missing abstraction layer, God objects doing too many things                                                    |
| Resource management  | `resource`      | DB connection or file handle not closed, missing flush/drain before close(), no timeout on external HTTP/DB calls, event listeners not removed, timers not cleared                                                           |
| API surface leakage  | `api`           | Underlying library types exposed in public method signatures (use own types from types.ts), types not declared in types.ts, public methods missing JSDoc/function comment                                                    |
| Security             | `security`      | Secrets or credentials hardcoded in source, unvalidated external input passed directly to DB/exec/eval, sensitive data (passwords, tokens) written to log messages                                                           |
| Framework coupling   | `coupling`      | Business logic inside Express route handlers or middleware (must live in pure helper functions), direct dependency on req/res objects deep in logic, DB driver used directly in app bypassing util-\* package                |
| Docs completeness    | `docs`          | README.md missing API table or config reference table, SKILL.md missing Rules section                                                                                                                                          |
| Checklist compliance | `checklist`     | Package name not `@util/*`, folder not `packages/util-*`, missing SKILL.md, missing README.md, package.json missing scripts (build/test/typecheck/clean)                                                                       |
| Package invariants   | `invariant`     | Raw DB/HTTP/AWS library used directly in app code (must use util-\* package), env vars loaded inside a package (only app loads env), library-internal types imported by consumers past index.ts, secrets not passed from app |

---

## Severity guide

When writing findings, add a severity prefix to the description:

- `[high]` — security issue, data loss risk, resource leak, broken invariant
- `[med]` — logic bug, missing test coverage for a critical path, design issue
- `[low]` — style violation, missing comment, minor docs gap

Example:

```markdown
## Open Issues

- [ ] [high] MongoDB connection never closed in error path — `src/mongo.ts:87` — [resource]
- [ ] [med] Missing test for concurrent create() calls — `src/logger.test.ts` — [test-coverage]
- [ ] [low] Function `buildTransport` missing JSDoc comment — `src/helpers/build-transport.util.ts:12` — [api]
```

---

## Summary checklist (run mentally before writing review.md)

- [ ] Checked all source files for style, logic, design, resource, api, security, coupling
- [ ] Checked test files for edge case coverage gaps (lifecycle, per-feature, per-error-path, child/scoped)
- [ ] Checked README.md for API table and config reference
- [ ] Checked SKILL.md Rules section for invariants, then verified code upholds them
- [ ] Checked package.json name follows `@util/*` convention
- [ ] Assigned severity ([high]/[med]/[low]) to every finding
- [ ] Moved any previously open issues that are now fixed to Completed
