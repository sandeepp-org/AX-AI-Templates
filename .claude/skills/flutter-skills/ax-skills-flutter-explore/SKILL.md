---
name: ax-skills-flutter-explore
description: Runs the interactive explore step after Flutter bootstrap, grounded in Flutter/BLoC code and context, iteratively updating an explore markdown report (with state-management and platform design) that is ready for propose.
---

# Step 2: Flutter Explore

## Path resolution

Read `./.claude/skills/ax-skills-flutter-workflow/config/paths.config.yaml` first. Use these keys for all artifact paths (do not hardcode `ax-flutter-sdd-artifacts/...`):

- `paths.bootstrap_output_file` — bootstrap config to read for gates and context
- `paths.explore_output_dir` — directory for `explore-*.md` files
- `paths.explore_output_glob` — valid explore file selection pattern
- `paths.explore_source_markdown_dir` — staging directory for converted uploads
- `templates.explore_report_template` — explore markdown shape
- `scripts.convert_to_markdown` — helper script path

Also read `./.claude/skills/ax-skills-flutter-workflow/config/workflow.config.yaml` and honor:

- `defaults.question_mode.explore`
- `defaults.bootstrap.ask_iterative_followups_until_complete` (interaction style guidance)
- `defaults.flutter` (state management, architecture, target platforms, assumed libraries)

## Gate

Run `explore` only when bootstrap is complete and valid.

Hard gate requirements:

1. The file at `paths.bootstrap_output_file` exists.
2. Required bootstrap fields are non-empty:
   - `solution_name`
   - `scope_overview`
   - `actors` (at least 1 value)
   - `tech_stack` (at least 1 value)
   - `target_platforms` (at least 1 of web/iOS/Android)
   - `state_management`
3. No placeholder/TBD values in required fields.

If any gate check fails, stop immediately and return which required fields are missing/invalid and the exact action needed to complete bootstrap. Do not generate `explore-*.md` when gate checks fail.

## User intent gate (required)

`explore` must start from explicit user intent. Do not start from a blank command alone.

Valid intent seeds include:

- a concrete feature/problem to explore (e.g. "biometric login", "offline catalog")
- a requested change to existing specs (add/change/delete)
- a request to evaluate options for a named capability (e.g. routing approach, pagination)
- an explicit request: "suggest new features" (creative ideation mode)
- an explicit request to explore from referenced docs (PRDs, RFCs, PDFs, Word docs, markdown notes, Figma links)

If the user only says "run explore" without intent: stop before creating/updating explore artifacts, ask for the intent seed, and offer 3-5 candidate prompt options.

## Goal

Run an interactive exploration grounded in project facts (bootstrap, `lib/features`/`lib/core` code, uploaded docs, designs, and user context) and produce or iteratively refine one explore report aligned to `templates.explore_report_template`.

The explore output is discussion-backed baseline context for `propose`: complete enough to support high-quality atomic specs, without forcing every fine detail when those details can be inferred later during propose.

## Inputs

- Bootstrap file at `paths.bootstrap_output_file`
- Optional user documents (chat uploads, explicit paths; PDF, Word, Markdown, Figma links)
- Existing Flutter codebase context (feature modules, blocs/cubits, repositories, routes)

## Interaction stance

- Interactive and iterative: discuss, confirm, refine, and update the same explore file as understanding improves.
- Grounded and evidence-led: anchor claims to bootstrap, code, docs, designs, or explicit user statements.
- Anti-drift by guidance (not hard blocking): allow tangents, but record them in the out-of-scope section unless user explicitly re-scopes.
- Adaptive and non-scripted: ask focused follow-ups for requirement gaps; do not run a rigid questionnaire.
- Spec-ready orientation: capture enough structure for propose while avoiding speculative filler.

## Flutter-specific things to resolve during explore

Beyond generic scope/journey questions, drive the discussion to fill the Flutter sections of the template:

- **State management design** — for each unit of state, decide **Cubit (method-driven)** vs **Bloc (event-driven)** and record *why*. Enumerate states (freezed unions) and events/methods, injected dependencies, and side effects (navigation, snackbars, analytics).
- **Feature modules and integration** — which `lib/features/<module>` folders are touched; repositories/data sources; routes exposed (go_router); shared `lib/core` integration.
- **Platform and responsiveness** — which of web/iOS/Android are in scope for this slice; responsive/adaptive layout; platform-specific concerns (web path-URL/SEO, iOS permissions, Android back handling); plugins needing per-platform support or fallbacks.

## Mandatory interaction policy

`explore` is not a silent artifact generation step.

- On first invocation, start with an interaction kickoff summary and focused questions derived from known gaps.
- Do not complete explore in the same turn without user interaction.
- Ask at least one clarification round covering scope boundaries, user journey intent, state-management shape, target platforms, and high-impact unknowns.
- If user is unavailable or declines interaction, stop and report that explore cannot be marked complete under interactive mode.
- Autonomous feature ideation is allowed only when the user explicitly asks for suggestions/new ideas.

## Explore file selection and iterative-write behavior

Use exactly one explore file as the working artifact for this run:

1. If the user explicitly points to an explore file path, use that file if valid under `paths.explore_output_glob`.
2. Else, if exactly one existing file matches `paths.explore_output_glob`, continue iterating in that file.
3. Else, create a new timestamped file under `paths.explore_output_dir` named `explore-YYYYMMDD-HHMMSS.md` from the explore template and use it for iterative updates in this run.

Rules:

- Never spread one exploration session across multiple explore files unless the user explicitly requests branching.
- Every significant clarification/decision should update the active explore file (not only at the end).
- Creating the initial explore file is allowed before discussion starts, but it is a working draft until interaction criteria are satisfied.
- Keep the file coherent and deduplicated as it evolves.
- Treat user-referenced docs/designs as first-class evidence. If a referenced path is missing/unreadable, ask for a corrected path/attachment and continue with available sources.

## Process

1. Read `paths.config.yaml`, then the bootstrap file, and verify the hard gate.
2. Enforce the user intent gate before creating/updating any explore artifact.
3. Collect document inputs from uploads and explicit path references.
4. For each source document, convert when needed: resolve `scripts.convert_to_markdown`, then from the repository root run `python ./<that value> --input "<path>" --output "<paths.explore_source_markdown_dir>/"` (creating the output directory if needed). Use Markdown sources directly when conversion is unnecessary.
5. Build a grounded context map from bootstrap + scoped Flutter code + document evidence + user discussion. If docs conflict with code/bootstrap, surface the conflict and ask the user to choose direction before finalizing.
6. Start interaction kickoff: summarize grounded understanding, include key findings from referenced documents/designs, present targeted requirement gaps (including Bloc-vs-Cubit and platform scope), and ask focused questions before considering explore complete.
7. Select/create the active explore file per iterative-write behavior, using `templates.explore_report_template`, then begin iterative updates.
8. Run iterative discussion cycles: ask focused follow-ups, compare options (state type, navigation, data/caching), challenge assumptions that conflict with constraints, and capture decisions and rationale in the decision-trail section.
9. For tangent ideas, keep exploration flowing but classify them in the out-of-scope section unless user confirms scope change.
10. Continuously maintain concrete content in required sections (including **State Management Design** and **Platform and Responsiveness Notes**) so the file stays propose-ready-in-progress.
11. Enforce high-impact resolution before completion: capture high-impact unknowns in the high-impact-open-questions section; do not mark explore complete while high-impact rows are unresolved or blocked without user decision.
12. Before finalizing, validate mandatory H2s derived from the explore template and enforced by `workflow.schema.yaml` gate flags, with concrete rows and no placeholder-only content.
13. Ensure the proposal-status section is present and valid: during explore **State** = `pending`, **Last updated** aligned to latest update timestamp, **Generated specs** remains `none` until propose runs.
14. Confirm readiness for `propose`, provide the active explore file path, and remind the user to pass this exact path when multiple explore files exist.

## Completion criteria for explore

Treat explore as complete only when all are true:

1. All mandatory sections from `templates.explore_report_template` exist and contain concrete, non-placeholder values — including **State Management Design** and **Platform and Responsiveness Notes**.
2. The report is grounded: key rows and decisions cite source grounding (bootstrap/code/docs/designs/user input).
3. High-impact open questions are resolved (or explicitly decided by user with clear tradeoff notes).
4. Bloc-vs-Cubit choices and target platforms for each slice are decided.
5. The report contains enough context for `propose` to generate atomic specs without re-discovery of core scope.
6. Proposal status is initialized correctly for downstream propose.
