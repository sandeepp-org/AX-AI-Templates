---
name: ax-skills-flutter-workflow
description: Orchestrates a three-step spec driven workflow (bootstrap, explore, propose) for a multiplatform (web/iOS/Android) Flutter app built with BLoC + Cubit and feature-first clean architecture. Use when the user asks to run or customize the Flutter spec workflow.
---

# Flutter Spec Driven Workflow Orchestrator

Use this skill to run an end-to-end spec workflow for a Flutter (BLoC + Cubit) app with strict ordering:

1. `bootstrap`
2. `explore` (requires bootstrap output)
3. `propose` (requires explore output)

This is the Flutter-tuned sibling of the generic SDD workflow: same gating machinery, but bootstrap/explore/propose templates and gates carry Flutter, BLoC/Cubit, feature-first clean architecture, and web/iOS/Android platform context.

## Canonical Files

- Workflow schema: `./.claude/skills/ax-skills-flutter-workflow/config/workflow.schema.yaml`
- Workflow config: `./.claude/skills/ax-skills-flutter-workflow/config/workflow.config.yaml`
- Path config: `./.claude/skills/ax-skills-flutter-workflow/config/paths.config.yaml`
- Templates: `./.claude/skills/ax-skills-flutter-workflow/templates/`
- Optional helper scripts: `./.claude/skills/ax-skills-flutter-workflow/scripts/`

## Execution Rules

1. Read `workflow.config.yaml` and `paths.config.yaml` first. Honor `defaults.flutter` (state management, architecture, target platforms, assumed libraries) as project-wide context.
2. Enforce hard step gates from `workflow.schema.yaml`:
   - Apply template-derived bootstrap non-empty validation and placeholder rejection before `explore` (including `target_platforms` and `state_management`).
   - Apply template-derived explore/atomic markdown section validation and placeholder rejection before and during `propose`.
   - Do not run `propose` unless a **chosen** explore output is complete (not placeholder/incomplete): the user should pass a specific `explore-*.md` path, or if exactly one file matches `paths.explore_output_glob`, that file may be used when the user did not specify one.
3. Always write outputs to paths from `paths.config.yaml` (default root: `ax-flutter-sdd-artifacts/`).
4. Use templates from `templates/` when generating documents.
5. If user provides docs/designs as context, convert to markdown with `scripts/convert_to_markdown.py` before requirement extraction.
6. If a gate fails, stop and return actionable remediation steps; do not create downstream artifacts.

## Step Routing

- If user says "bootstrap", apply `ax-skills-flutter-bootstrap`.
- If user says "explore", apply `ax-skills-flutter-explore`.
- If user says "propose", apply `ax-skills-flutter-propose`.
- If user says "run workflow", determine next required step by checking existing outputs.

## Relationship to the engineering skills

The spec workflow produces *what to build*. The Flutter engineering skills produce *how to build and verify it*:

- `ax-skills-flutter-architecture` — the engineering standard: feature-first clean architecture, BLoC/Cubit, navigation/deep-linking, networking/offline, error-handling/observability, security, performance, responsive layout, i18n/a11y, environments/build, and CI/CD (with deep-dive helpers). Everything below references it.
- `ax-skills-flutter-ui` — the UI & design-system standard: design tokens, theme variables/modes (light/dark/brand), an Atomic-Design component library, page composition, and Figma-to-code (Figma MCP). Owns `lib/design_system/`. Load it before building any screen.
- `ax-skills-flutter-planning` — turn an approved spec into `docs/plan.md` (problem, requirements, BLoC architecture, phases, test plan, decision log) before any code.
- `ax-skills-flutter-testing` — unit, bloc_test, widget, golden, and integration testing across web/iOS/Android, with coverage and CI conventions.
- `ax-skills-flutter-code-review` — review Dart/Flutter/BLoC code against the standard's 15 categories after each phase.
- `ax-skills-flutter-commit-policy` — pre-commit hygiene (`dart format`, `flutter analyze`, `build_runner`, `flutter test`) and commit/PR rules.

## Output Contract

Resolve paths from `paths.config.yaml`:

- Bootstrap output file (required): `paths.bootstrap_output_file`
- Explore output file (required): under `paths.explore_output_dir`, named like `explore-YYYYMMDD-HHMMSS.md` (see `paths.explore_output_glob`)
- Propose output files (required): one markdown per atomic spec under `paths.proposed_output_dir`

## Customization Notes

- **Output layout** (markdown sections, YAML keys for bootstrap): edit templates under `templates/` and paths in `paths.config.yaml`. The workflow schema references those templates via `template_path_key` — do not duplicate full field lists in the schema.
- **Workflow graph** (step order, path keys, machine gates): edit `workflow.schema.yaml`.
- **Project assumptions** (state management, architecture, platforms, libraries): edit `workflow.config.yaml` → `defaults.flutter`.
- **Directories and template file paths**: edit `paths.config.yaml`.
