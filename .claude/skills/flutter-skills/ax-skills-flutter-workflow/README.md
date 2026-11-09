# Flutter Spec Workflow Setup (BLoC + Cubit)

This project includes a Flutter-tuned skill suite for spec-driven development plus engineering practice. The app targets **web, iOS, and Android**, uses **BLoC + Cubit** (flutter_bloc), and follows **feature-first clean architecture**.

## Skills in this suite

Spec workflow (what to build):

- `ax-skills-flutter-bootstrap`
- `ax-skills-flutter-explore`
- `ax-skills-flutter-propose`
- `ax-skills-flutter-workflow` (orchestrator)

Engineering practice (how to build and verify):

- `ax-skills-flutter-architecture` — **the engineering standard** (flagship): folder layout + BLoC/Cubit conventions, plus deep-dive helpers for responsive layout, navigation/deep-linking, networking/offline, error-handling/observability, security, performance, i18n/a11y, project structure/flavors/codegen, and CI/CD
- `ax-skills-flutter-ui` — **the UI & design-system standard**: design tokens, theme variables/modes (light/dark/brand), Atomic-Design component library, page composition, and Figma-to-code (owns `lib/design_system/`)
- `ax-skills-flutter-planning` — `docs/plan.md`, phases, decision log (mandatory before code)
- `ax-skills-flutter-testing` — unit/bloc_test/widget/golden/integration testing + coverage
- `ax-skills-flutter-code-review` — Dart/Flutter/BLoC review (15 categories), writes `docs/review.md`
- `ax-skills-flutter-verify` — **runtime verification**: runs the app via the Dart MCP server and inspects the live widget tree + runtime errors to confirm a change renders/behaves, writes `docs/verify.md`
- `ax-skills-flutter-commit-policy` — pre-commit checks and commit/PR rules

### Aspects covered

Architecture · state management (Bloc vs Cubit) · DI · navigation & deep/universal/app links · networking (dio/retrofit) · caching & offline · error handling & Failure taxonomy · logging, crash reporting & observability · security (secrets, secure storage, pinning, obfuscation) · performance (rebuilds, lists, images, web renderer/deferred loading) · **design system: tokens, theme variables/modes, Atomic-Design components, page composition, Figma-to-code** · responsive/adaptive layout · localization (intl/ARB, RTL) · accessibility · environments/flavors & `--dart-define` · code generation (freezed/json/retrofit) · assets & fonts · testing (all levels incl. goldens) · CI/CD & per-platform release (web/iOS/Android).

## Recommended setup: Dart & Flutter MCP server

Register the first-party Dart & Flutter MCP server in the app repo so the engineering-practice skills get a structured, self-correcting feedback loop (analyze/test/format/codegen as machine-readable diagnostics, pub.dev search, symbol/docs resolution, and running-app introspection) instead of parsing CLI text:

```
# requires Dart 3.9+
claude mcp add --transport stdio dart -- dart mcp-server
```

`ax-skills-flutter-commit-policy`, `ax-skills-flutter-testing`, and `ax-skills-flutter-code-review` prefer these tools when the server is registered and fall back to the CLI otherwise. `ax-skills-flutter-verify` **requires** the server — its running-app introspection (live widget tree + runtime errors) has no CLI equivalent. Toggle the behavior in `./.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`. (The UI skill separately uses the **Figma MCP** for design-to-code.)

## Layered CLAUDE.md

The suite maintains a **layered `CLAUDE.md`** so the agent gets the right context at the right depth, loaded additively:

- **Root `CLAUDE.md`** (app root) — the big picture: stack, feature map, scoped commands, pointers to the standards. Owned by `ax-skills-flutter-bootstrap`.
- **Feature `lib/features/<name>/CLAUDE.md`** — local conventions: the Bloc-vs-Cubit choice, routes owned, repository contracts, state shape, deviations. Owned by `ax-skills-flutter-planning`.

Both are intentionally **lean** — they point to the skills rather than restating them, and the feature files never duplicate the root. Shape: `./.claude/skills/ax-skills-flutter-workflow/templates/claude-md.template.md`. `ax-skills-flutter-code-review` flags a feature `CLAUDE.md` that has gone stale; `ax-skills-flutter-commit-policy` keeps it in sync on contract/route/state changes.

## Invoke From Chat

Use prompts like:

- "Run flutter bootstrap for spec workflow"
- "Run flutter explore for spec workflow for <feature/problem/change>"
- "Run flutter propose for spec workflow"
- "Run full flutter spec workflow from current state"

## How To Use Explore

`explore` is an interactive discovery step for new specs (and related add/change/delete impacts). It is not a silent one-shot file generation step.

### 1) Start with explicit intent

- "Run flutter explore for spec workflow for biometric login."
- "Run flutter explore for spec workflow for offline-first product catalog."
- "Run flutter explore for spec workflow and suggest new features for the profile module."
- "Run flutter explore for spec workflow from this PRD: @docs/prd-checkout.md"

If you only say "Run flutter explore" without intent, the agent asks follow-up questions before creating/updating explore output.

### 2) Bring supporting documents (optional)

Explore can use chat uploads, explicit file path references, and common formats (Markdown, PDF, Word, Figma links). Non-markdown docs are converted with `scripts/convert_to_markdown.py`.

### 3) Expect iterative interaction

During explore, the agent asks clarification questions, identifies requirement gaps and conflicts, compares Bloc-vs-Cubit and navigation/data options, keeps tangents as out-of-scope candidates, and resolves high-impact open questions before completion.

### 4) Output behavior

Explore works on a single active `explore-*.md` file per session and updates it iteratively. The output is discussion-backed baseline context for `propose`.

When complete:

- "Run flutter propose for spec workflow using @ax-flutter-sdd-artifacts/explore/explore-YYYYMMDD-HHMMSS.md"

## Customize Workflow

- Step order, path keys, gate rules: `./.claude/skills/ax-skills-flutter-workflow/config/workflow.schema.yaml`
- Output document structure (sections, tables, bootstrap YAML keys, layered CLAUDE.md): `./.claude/skills/ax-skills-flutter-workflow/templates/`
- Project assumptions (state mgmt, architecture, platforms, libs): `./.claude/skills/ax-skills-flutter-workflow/config/workflow.config.yaml`
- Output paths and template/script references: `./.claude/skills/ax-skills-flutter-workflow/config/paths.config.yaml`
- Tool surface (Dart MCP vs CLI, capability mapping): `./.claude/skills/ax-skills-flutter-workflow/config/tooling.config.yaml`

## Note on path prefixes

SKILL.md files reference workflow assets under `.claude/skills/ax-skills-flutter-workflow/...` to match the Claude Code convention. If you deploy these skills under a different agent root, update the prefix in `paths.config.yaml` and the step skills accordingly.
