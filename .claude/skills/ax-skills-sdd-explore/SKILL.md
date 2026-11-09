---
name: ax-skills-sdd-explore
description: Runs the interactive explore step after bootstrap, grounded in code and context, with iterative updates to an explore markdown report that is ready for propose.
---

# Step 2: Explore

## Path resolution

Read `./.claude/skills/ax-skills-sdd-workflow/config/paths.config.yaml` first. Use these keys for all artifact paths (do not hardcode `ax-sdd-artifacts/...`):

- `paths.bootstrap_output_file` — bootstrap config to read for gates and context
- `paths.explore_output_dir` — directory for `explore-*.md` files
- `paths.explore_output_glob` — valid explore file selection pattern
- `paths.explore_source_markdown_dir` — staging directory for converted uploads
- `templates.explore_report_template` — explore markdown shape
- `scripts.convert_to_markdown` — helper script path

Also read `./.claude/skills/ax-skills-sdd-workflow/config/workflow.config.yaml` and honor:

- `defaults.question_mode.explore`
- `defaults.bootstrap.ask_iterative_followups_until_complete` (interaction style guidance)

## Gate

Run `explore` only when bootstrap is complete and valid.

Hard gate requirements:

1. The file at `paths.bootstrap_output_file` exists.
2. Required bootstrap fields are non-empty:
   - `solution_name`
   - `scope_overview`
   - `actors` (at least 1 value)
   - `tech_stack` (at least 1 value)
3. No placeholder/TBD values in required fields.

If any gate check fails, stop immediately and return:

- which required fields are missing/invalid
- exact action needed to complete bootstrap

Do not generate `explore-*.md` when gate checks fail.

## User intent gate (required)

`explore` must start from explicit user intent. Do not start from a blank command alone.

Valid intent seeds include:

- a concrete feature/problem to explore
- a requested change to existing specs (add/change/delete)
- a request to evaluate options for a named capability
- an explicit request: "suggest new features" (creative ideation mode)
- an explicit request to explore from referenced docs (for example PRDs, RFCs, PDFs, Word docs, or markdown notes)

If the user only says "run explore" (or equivalent) without intent:

- stop before creating or updating explore artifacts
- ask the user for the intent seed (problem, feature area, or goals)
- offer 3-5 candidate prompt options to help them choose

## Goal

Run an interactive exploration that stays grounded in project facts (bootstrap, source code, uploaded docs, architecture, and user context) and produce or iteratively refine one explore report aligned to `templates.explore_report_template`.

The explore output is discussion-backed baseline context for `propose`: complete enough to support high-quality atomic specs, without forcing every fine detail when those details can be inferred later during propose.

## Inputs

- Bootstrap file at `paths.bootstrap_output_file`
- Optional user documents:
  - provided in chat context/uploads
  - explicitly referenced by user path
  - supported examples: PDF, Word documents, Markdown
- Existing codebase context

## Interaction stance

- Interactive and iterative: discuss, confirm, refine, and update the same explore file as understanding improves.
- Grounded and evidence-led: anchor claims to bootstrap, code, docs, or explicit user statements.
- Anti-drift by guidance (not hard blocking): allow tangents, but record them in the out-of-scope section defined by the active explore template unless user explicitly re-scopes.
- Adaptive and non-scripted: ask focused follow-ups for requirement gaps; do not run a rigid questionnaire.
- Spec-ready orientation: capture enough structure for propose while avoiding speculative filler.

## Mandatory interaction policy

`explore` is not a silent artifact generation step.

- On first invocation, start with an interaction kickoff summary and focused questions derived from known gaps.
- Do not complete explore in the same turn without user interaction.
- Ask at least one clarification round that covers scope boundaries, user journey intent, and high-impact unknowns.
- If user is unavailable or declines interaction, stop and report that explore cannot be marked complete under interactive mode.
- Autonomous feature ideation is allowed only when the user explicitly asks for suggestions/new ideas.

## Explore file selection and iterative-write behavior

Use exactly one explore file as the working artifact for this run:

1. If the user explicitly points to an explore file path, use that file if valid under `paths.explore_output_glob`.
2. Else, if exactly one existing file matches `paths.explore_output_glob`, continue iterating in that file.
3. Else, create a new timestamped file under `paths.explore_output_dir` named `explore-YYYYMMDD-HHMMSS-<intent-slug>.md` from the explore template and use it for iterative updates in this run.
4. **Forge app (ForgeWorkflow BRD / explore chat):** The forge API host may **pre-create** that same `explore-YYYYMMDD-HHMMSS-<intent-slug>.md` file under `paths.explore_output_dir` and rewrite the CLI invocation with `using @<repo-relative-path>` so the skill writes into a stable path (same naming convention as step 3 — timestamp format matches `scripts/make-explore-filename.ts`). Treat the pinned path as the active artifact for this run; **do not** create a second parallel `explore-*.md` unless the user explicitly requests branching.

Rules:

- Never spread one exploration session across multiple explore files unless the user explicitly requests branching.
- If the incoming command already contains `using @…/explore/explore-*.md`, treat that file as selected — iterate there instead of minting another timestamped explore file.
- Every significant clarification/decision should update the active explore file (not only at the end).
- Creating the initial explore file is allowed before discussion starts, but it is only a working draft and must not be treated as completed output until interaction criteria are satisfied.
- Keep the file coherent and deduplicated as it evolves.
- Treat user-referenced docs as first-class evidence. If any referenced path is missing or unreadable, ask for a corrected path/attachment and continue interaction with available sources.

## Process

1. Read `paths.config.yaml`, then the bootstrap file at `paths.bootstrap_output_file`, and verify the hard gate.
2. Enforce the user intent gate before creating/updating any explore artifact.
3. Collect document inputs from both uploads and explicit user path references.
4. For each source document, convert when needed: resolve `scripts.convert_to_markdown` from `paths.config.yaml`, then from the repository root run `python ./<that value> --input "<path>" --output "<paths.explore_source_markdown_dir>/"` (creating the output directory if needed). Use Markdown sources directly when conversion is unnecessary.
5. Build a grounded context map from bootstrap + scoped code + document evidence + user discussion. Capture source grounding in relevant sections. If docs conflict with code/bootstrap, surface the conflict and ask the user to choose direction before finalizing.
6. Start interaction kickoff:
   - summarize current grounded understanding
   - include key findings from referenced documents
   - present targeted requirement gaps and potential conflicts
   - ask focused questions before considering explore complete
7. Select/create the active explore file per iterative-write behavior above, using template at `templates.explore_report_template`, then begin iterative updates.
8. Run iterative discussion cycles:
   - ask focused follow-ups for missing or ambiguous requirements
   - compare options when useful
   - challenge assumptions that conflict with known constraints
   - capture decisions and rationale in the decision-trail section defined by the template
9. For tangent ideas, keep exploration flowing but classify them in the out-of-scope section from the template unless user explicitly confirms scope change.
10. Continuously maintain concrete content in required sections so the file stays propose-ready-in-progress.
11. Enforce high-impact resolution before completion:
   - capture high-impact unknowns in the high-impact-open-questions section from the template
   - do not mark explore complete while high-impact rows are unresolved or blocked without user decision
12. Before finalizing, validate mandatory H2s derived from the explore template and enforced by `workflow.schema.yaml` gate flags, with concrete rows and no placeholder-only content.
13. Ensure the proposal-status section defined by the template is present and valid:
   - during explore: **State** `explore-done-tasks-pending` (human-readable: explore complete, tasks not yet generated)
   - **Last updated** aligned to latest update timestamp
   - **Generated specs** remains `none` until propose runs
   - Do not change **State** to any other value during explore; the `tasks-generating`, `tasks-generated`, and `task-generation-failed` values are set exclusively by the propose skill
14. Confirm readiness for `propose`, provide the active explore file path, and remind user to pass this exact path when multiple explore files exist.

## Completion criteria for explore

Treat explore as complete only when all are true:

1. All mandatory sections from `templates.explore_report_template` exist and contain concrete, non-placeholder values.
2. The report is grounded: key rows and decisions cite source grounding (bootstrap/code/docs/user input).
3. High-impact open questions are resolved (or explicitly decided by user with clear tradeoff notes).
4. The report contains enough context for `propose` to generate atomic specs without re-discovery of core scope.
5. Proposal status is initialized correctly for downstream propose.
