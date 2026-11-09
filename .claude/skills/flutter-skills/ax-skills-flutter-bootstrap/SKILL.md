---
name: ax-skills-flutter-bootstrap
description: Collects and persists base solution context for a multiplatform (web/iOS/Android) Flutter app using BLoC + Cubit. Use when starting the Flutter workflow bootstrap or creating/updating flutter-bootstrap-config.
note for the skill developer: Do **not** maintain a parallel list of field names in this skill.
---

# Step 1: Flutter Bootstrap

## Goal

Create or update `ax-flutter-sdd-artifacts/bootstrap/flutter-bootstrap-config.yaml`.

## What to collect (source of truth)

1. **All keys and structure** come from the bootstrap config template:
   - `./.claude/skills/ax-skills-flutter-workflow/templates/flutter-bootstrap-config.template.yaml`
   - Treat every **top-level YAML key** in that file as a section to fill (skip comment-only lines).
   - Match value shapes to the template (`""` vs `[]` as shown).

2. **Minimum fields that must be non-empty before explore is allowed** are defined only in the workflow schema (so gates stay in one place):
   - `./.claude/skills/ax-skills-flutter-workflow/config/workflow.schema.yaml` → `workflow.steps` → step `id: bootstrap` → `gate_validation` (explicit required fields + template-derived gate flags). Note these include `target_platforms` and `state_management`.

Collect values for **every** template key; enforce the schema gate's minimum non-empty rules before explore.

## Collection Strategy

- Infer candidate values from the Flutter source first:
  - `pubspec.yaml` (Flutter/Dart SDK constraints, dependencies → `tech_stack`, `assumed_libraries`).
  - `lib/` layout (`lib/features/*`, `lib/core/*`) → `architecture_style`, `key_feature_modules`.
  - Presence of `flutter_bloc`, `go_router`, `dio`/`retrofit`, `freezed`/`json_serializable` → `state_management`, `navigation_strategy`, `networking_and_data`.
  - Platform folders (`web/`, `ios/`, `android/`), and any `macos/`, `windows/`, `linux/` → `target_platforms`.
  - `analysis_options.yaml`, `test/`, `integration_test/`, CI config → `testing_strategy`, `ci_cd_and_release`.
- **Ignore non-functional process artifacts** when inferring solution context: skill files, skill templates, generated workflow outputs, and agent/process instructions.
- Ask the user interactive questions for missing/uncertain fields using the template key names and nearby comments as wording guidance.
- Use iterative follow-ups: if the user gives partial answers, ask only for the remaining missing fields and continue until all required gate fields are complete.
- For inferred values, explicitly ask the user to confirm or correct before writing the final config file.

## Process

1. Read `flutter-bootstrap-config.template.yaml`.
2. Read `workflow.schema.yaml` bootstrap `gate_validation` for the explore gate minimum.
3. Inspect `pubspec.yaml`, `lib/`, platform folders, and tooling to infer draft values for template keys while excluding process artifacts.
4. Ask concise interactive questions for unknown, ambiguous, or unconfirmed fields — especially `target_platforms` (which of web/iOS/Android) and `state_management` (where BLoC vs Cubit is preferred).
5. If any required gate field remains missing after a user reply, ask iterative follow-up questions only for those gaps.
6. Ask the user to confirm the resolved final values.
7. Write merged output to `ax-flutter-sdd-artifacts/bootstrap/flutter-bootstrap-config.yaml` (same key set and shapes as the template).
8. **Generate or refresh the root `CLAUDE.md`** at the app root (path `root_claude_md` in `paths.config.yaml`) from the ROOT block of `claude-md.template.md`. This gives the agent the big picture, loaded every session.
9. Confirm bootstrap completion and indicate the next step is `explore`.

## Root CLAUDE.md (layered context)

Bootstrap owns the **root** `CLAUDE.md` — the top of a layered set (root = big picture; each `lib/features/<name>/CLAUDE.md` = local conventions, owned by `ax-skills-flutter-planning`). The agent loads them additively, so:

- Keep it **lean**. It is not documentation — only the few things an agent must know that it cannot infer from the code or the skills.
- **Point to the skills, don't restate them** (`ax-skills-flutter-architecture`, `ax-skills-flutter-ui`). Fill it from the resolved bootstrap values: app name/purpose, feature-module map, scoped commands (prefer the Dart MCP per `tooling.config.yaml`), and only genuinely global, non-obvious conventions.
- If a root `CLAUDE.md` already exists, **merge** — update the stack/commands/feature map and stamp `Last reviewed`; do not blow away hand-written project conventions.

## Validation

- Apply `workflow.schema.yaml` bootstrap `gate_validation`: required keys non-empty, no placeholder values from `reject_placeholder_values` where present.
- List-typed keys from the template must be YAML lists (at least one item where the schema marks them as required for the gate, e.g. `actors`, `tech_stack`, `target_platforms`).
- `target_platforms` items must be a subset of `[web, ios, android]`.
- `state_management` must name BLoC and/or Cubit (flutter_bloc); flag if the codebase uses a different approach so the user can reconcile.
