---
name: ax-skills-flutter-planning
description: "MANDATORY before any Flutter implementation. Writes problem definition, requirements, BLoC architecture (HLD + LLD), phases, test plan, and decision log into docs/plan.md. The plan must be approved (`approve plan`) before any code is written. Triggers on let's plan, design X, what should we build, new feature, new module, refactor, before I start."
metadata:
  version: "1.0"
---

# Flutter Decision & Planning (BLoC + Cubit)

Use this skill for **any Flutter work** — features, modules, shared core, theming, or platform integration. Follow these steps in order before writing any code. Ground every decision in `ax-skills-flutter-architecture` (folder layout, Bloc-vs-Cubit, DI, navigation, multiplatform rules) and, when a spec exists, in the atomic spec under `ax-flutter-sdd-artifacts/specs/`.

---

## Step 1 — Problem Definition

Answer these three before anything else. Do not proceed until all three are clear.

| Question | What to ask the user |
| --- | --- |
| What problem are we solving? | "What is broken, missing, or slow for the user right now?" |
| Who is the user? | "Who uses this — an app end user (web/iOS/Android), an internal role, another module?" |
| What does success look like? | "How will we know it's done? What is the measurable outcome (e.g. screen loads < 1s, works offline, deep-link refresh-safe on web)?" |

**Output — write into `docs/plan.md`:**

```markdown
## Problem Definition

**Problem:** <one sentence>
**User:** <who and on which platforms — web / iOS / Android>
**Success:** <measurable outcome>
```

Never skip this. Vague problems produce vague widgets.

---

## Step 2 — Requirement Gathering

Split requirements into two buckets before designing.

**Functional requirements** — what the feature must do (verb phrases: "list orders", "submit a review", "sign in with biometrics"). One line each, no implementation detail.

**Non-functional requirements** — how it must behave:

- Performance (frame budget, cold start, list scroll, image loading)
- Platforms (which of web/iOS/Android; min OS/browser; responsive breakpoints)
- Security (token storage, input validation, deep-link param validation)
- Reliability (offline/cached behavior, retry, error states, graceful failure)
- Accessibility (semantics, focus, contrast, text scaling)

**Output — write into `docs/plan.md`:**

```markdown
## Requirements

### Functional
- <capability 1>

### Non-functional
- Platforms: <web / iOS / Android + constraints>
- Performance: <target>
- Security: <requirement>
- Reliability: <offline/error behavior>
- Accessibility: <requirement>
```

If a requirement is unclear, ask before designing. Do not assume scope.

---

## Step 3 — Architecture & System Design

Design before building. Produce both levels, consistent with `ax-skills-flutter-architecture`.

**HLD (High Level Design):**

- Which `lib/features/<module>` does this live in? What `lib/core` pieces does it use?
- Data flow: UI → cubit/bloc → use case/repository contract → data source → backend.
- External dependencies (APIs, SDKs, plugins) and their platform support.
- Navigation: routes added/changed, guards, deep-link/web-URL behavior.

**LLD (Low Level Design):**

- **Bloc vs Cubit** decision (+ justification) for each unit of state.
- State shape (freezed): statuses/union, fields; events or public methods.
- Domain: entities, repository contract signatures, use cases.
- Data: models (json_serializable), data sources (retrofit endpoints), repository impl + error→Failure mapping.
- DI: where the repository is built (`core/di`) and how the bloc is provided (route-scoped vs app-level).
- Design system (`ax-skills-flutter-ui`): tokens used/added; DS components consumed; new DS components to create (atom/molecule/organism/template); page template + state-view; theme modes. New shared components are their own deliverable with gallery + goldens.
- Per-platform divergence (web/iOS/Android) and responsive layout approach.

**Output — write into `docs/plan.md`:**

```markdown
## Architecture

### HLD
<feature module, data flow, routes, external deps + platform support>

### LLD
- State: Cubit|Bloc `XCubit` — states: <...>, methods/events: <...>
- Domain: entity `X`, contract `XRepository.method(...) : Either<Failure, T>`, use case <...>
- Data: model `XModel` (json), source `XApi` (retrofit), `XRepositoryImpl`
- DI: build in core/di; provide via BlocProvider at <route|app>
- Platform: web <...>, iOS <...>, Android <...>; responsive <...>
- Error handling: <Failure mapping + UI error state>
```

If multiple valid architectures exist (e.g. Cubit vs Bloc, route-scoped vs app-level provider, REST vs local-first), present them as options with pros/cons before choosing.

---

## Step 4 — Decision Making

Before any design/implementation/structure choice:

1. **Ask the user** — "Why this option?"
2. **Present 2–3 alternatives** with pros/cons.
3. **Do not decide alone** — proceed only after the user confirms.
4. **Record the choice** in `docs/plan.md` so the reasoning is never lost.

**Wrong:** "I'll use a Bloc for the search field."

**Right:** "For the search field state, we could use:

- **Cubit** — simplest; call `search(query)`. No event log, manual debounce.
- **Bloc + debounce transformer** — clean search-as-you-type, cancels stale queries, auditable events. More boilerplate.
- **Bloc + bloc_concurrency `restartable`** — same, with explicit concurrency control.
  Which do you prefer, and why?"

**Ask instead of assume.** Every decision recorded in `plan.md` is part of the story of the code.

---

## Step 5 — Phase Planning

After problem, requirements, and architecture are defined, break work into phases.

**Rules:**

- Define phases in `docs/plan.md` under `## Phases` before writing code.
- A natural phase order for a feature: **(1) domain + data** (entities, contract, model, source, repo impl, unit tests) → **(2) state** (cubit/bloc + freezed state, bloc_test) → **(3) UI + navigation** (page, widgets, route, widget/golden tests) → **(4) platform polish** (web URL/refresh, iOS/Android specifics, responsiveness, integration test).
- Keep each phase small and independently reviewable.
- Each phase ends with a **review gate**: run `ax-skills-flutter-verify` (runtime) for any UI/behavior change, then `ax-skills-flutter-code-review`; fix all `[high]` and `[med]` findings before the next phase.
- `[low]` findings can carry over but must be resolved before the final phase.
- Never start a new phase while the previous phase has unresolved `[high]` or `[med]` issues.

**Phase structure in `docs/plan.md`:**

```markdown
## Phases

### Phase 1 — Domain + Data
Goal: <one sentence>
Deliverables:
- entity, repository contract, model, data source, repository impl
- unit tests for repository + error mapping
Review gate: run flutter-code-review, fix [high] + [med] before Phase 2.

### Phase 2 — State (Cubit/Bloc)
Goal: <one sentence>
Deliverables:
- cubit/bloc + freezed state/events
- bloc_test for all transitions incl. failure/empty
Review gate: run flutter-code-review, fix [high] + [med] before Phase 3.
```

---

## docs/plan.md — Full Required Structure

Every feature or module must have a `docs/plan.md` with all sections:

```markdown
## Problem Definition

## Requirements

## Architecture

## Phases

## Test Plan

## Planning Discussion

## Decision Log
```

**All decision and plan discussion in the plan:** Every clarification, Q&A, alternative considered, and user preference raised during planning must be recorded. Use `## Planning Discussion` for back-and-forth; use `## Decision Log` for final choices with reasoning. Nothing stays only in chat — the plan is the single source of truth.

**Test Plan timing:** The Test Plan must be created with the plan. List every `group` and its `test`/`blocTest`/widget/golden cases so coverage decisions are visible before any test file is written. A plan without a Test Plan is incomplete.

**README, plan, and architecture sync:** When modifying a module (new feature, route change, contract change), update the module README (overview, route table, public contract), the plan (Decision Log), the feature `CLAUDE.md` (see below), and confirm it still follows `ax-skills-flutter-architecture`.

### Feature CLAUDE.md (layered context)

Planning owns `lib/features/<name>/CLAUDE.md` — the **local** layer of the project's layered CLAUDE.md set (the root `CLAUDE.md` is owned by `ax-skills-flutter-bootstrap`; the agent loads them additively). Create or refresh it from the FEATURE block of `.claude/skills/ax-skills-flutter-workflow/templates/claude-md.template.md` whenever a plan is approved or a module's state/routes/contracts change. Keep it **lean and local**: the Bloc-vs-Cubit choice and why (link the Decision Log, don't repeat it), routes owned, repository contracts, state shape, platform divergence, and any deviation from the standard. Do **not** restate the engineering standard or duplicate the root file — only what an agent editing this feature can't infer from the code or the skills.

```markdown
## Decision Log

- <date> — Chose Cubit over Bloc for ProfileCubit because state is method-driven, no event log needed (confirmed by user)
- <date> — Route-scoped BlocProvider (not app-level) because state is screen-local
```

This is the story of the code — decisions, reasoning, and updates from first build through every change.

## Phase-wise development

Use **Step 5 — Phase Planning** as the required source for phase rules and `docs/plan.md` structure.

### Why phase-wise

- Catches problems before the next phase builds on top of them
- Keeps each review focused and manageable
- Prevents accumulated debt across the data/state/UI layers
- Flags issues early when they are cheap to fix

---

## Execution pipeline (after planning)

Once `docs/plan.md` includes acceptance checks and verification commands:

1. Request **`approve plan`** from the user (mandatory gate before implementation).
2. After approval: implement strictly per plan, then verify in two layers until the quality gate passes:
   - **Static:** `dart format`, `flutter analyze`, `flutter test` (and `flutter test integration_test` for critical flows).
   - **Runtime:** run `ax-skills-flutter-verify` for any change touching UI or user-facing behavior — launch the app and confirm the affected screens/states/navigation render and behave (incl. the failure path) with no runtime errors.
   - Then scoped `ax-skills-flutter-code-review`.
3. Follow `ax-skills-flutter-commit-policy` before committing.
