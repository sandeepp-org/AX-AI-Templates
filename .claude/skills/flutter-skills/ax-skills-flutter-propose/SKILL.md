---
name: ax-skills-flutter-propose
description: Turns a completed Flutter explore report into canonical atomic spec markdown under paths.proposed_output_dir—scoped per feature module, BLoC/Cubit-aware, platform-aware (web/iOS/Android), and sized for coding agents to plan before implementation.
---

# Step 3: Flutter Propose

## Path and template resolution

1. Read `./.claude/skills/ax-skills-flutter-workflow/config/paths.config.yaml`.
2. Resolve these keys for all reads and writes (do not hardcode artifact directories):
   - `paths.bootstrap_output_file` — bootstrap context
   - `paths.explore_output_glob` — glob for valid explore artifacts (e.g. `explore-*.md`)
   - `paths.explore_output_dir` — parent directory of explore files
   - `paths.proposed_output_dir` — where atomic spec markdown files are written (also scan here for **prior atomic specs**)
   - `templates.atomic_spec_template` — atomic spec template

## Selecting the explore input

Resolve **exactly one** explore markdown file using this order:

1. **Explicit path** from the user (message, `@` reference, or clearly indicated open file): use it if it exists.
2. If no path and **exactly one** file matches `paths.explore_output_glob`, use that file and state the assumption.
3. If no path and **zero or multiple** files match, stop and ask which `explore-*.md` to use. Do not pick "latest" by timestamp.

**Path validity:** The chosen file must match `paths.explore_output_glob`. Reject paths outside that contract.

## Gate

Run `propose` only when explore is complete and valid for the **selected** explore file.

Hard gate requirements:

1. The selected explore file exists and matches `paths.explore_output_glob`.
2. Verify it is a real completed explore output (not a stub).
3. Reject explore files that are placeholders or incomplete (only `TBD`/`N/A`, or only open questions without concrete specs).
4. Confirm the explore file includes every mandatory section from `explore-report.md`, using template-derived H2 validation from `workflow.schema.yaml` gate flags, with concrete rows where applicable — including **State Management Design** and **Platform and Responsiveness Notes**. The `## Proposal Status` section must exist; before writing specs, **State** may be `pending` or a prior failed/in_progress value from an interrupted run.

If any gate check fails, stop immediately and return why explore is incomplete and what must be updated. Set `## Proposal Status` → **State** to `failed` and **Last updated** to an ISO-8601 UTC timestamp, with a short **Notes** bullet. Do not write or overwrite files under `paths.proposed_output_dir` when gate checks fail.

## Goal

Produce **canonical atomic spec files** under `paths.proposed_output_dir`: each file is the single planning artifact a coding agent reads to **build an implementation plan** — bounded scope, explicit acceptance checks, clear boundaries, and **ordered dependency** on other specs where applicable.

This step **creates or refreshes** those specs from the selected explore; it does not replace code review or task trackers.

## Supplemental instructions (editor-maintained)

Maintainers may **edit the bullet list in this section only** to add standing rules for every `propose` run. Treat bullets here as **constraints** on tone and depth. If a bullet conflicts with the selected explore file on **factual scope**, the explore file wins.

- **NFRs:** Do not inflate non-functional requirements. Add NFRs only when the user or explore explicitly needs them for this slice; otherwise keep that subsection minimal (honest `N/A` over placeholder noise).
- **Bloc vs Cubit:** Every spec that introduces state must state the choice and a one-line justification (Cubit for simple method-driven state; Bloc when an event stream, traceability, or complex transitions justify it). Do not leave it unspecified.
- **Platform scope:** Every spec must record which of web/iOS/Android it targets and any per-platform divergence. Default to all three unless the explore narrows it.
- **Design system:** Every spec with UI must fill §5 **Design system mapping** — tokens used/added, DS components consumed, and DS components to create (atom/molecule/organism/template) per `ax-skills-flutter-ui`. New shared components are their own slice/deliverable, not buried inside a page. Never imply raw-literal styling.
- _(Add more bullets below as needed.)_

## Context to gather (before drafting specs)

Use **all** of the following; narrow reads deliberately so context stays faithful and bounded.

1. **Bootstrap** — Read `paths.bootstrap_output_file` (solution name, scope, actors, tech stack, target platforms, state management, architecture style, feature modules). Use it to ground terminology, stack, and scope.
2. **Selected explore** — Treat tables and narrative (feature modules, components, state-management design, new vs changed specs) as the **authoritative backlog**. Every delivered atomic spec must map to explore content (possibly after merge/split).
3. **Source code (scoped)** — For brownfield, read **only** code paths implied by explore + bootstrap: the relevant `lib/features/<module>/{data,domain,presentation}` files, `lib/core` shared pieces (router, DI wiring, network), `pubspec.yaml`, and platform config (`web/index.html`, `ios/Runner/Info.plist`, `android/app/build.gradle`) the rows reference. Widen only to resolve a concrete ambiguity; record "not searched" gaps in **Important Notes**.
4. **Prior atomic specs in `paths.proposed_output_dir`** — Do **not** load every file by default. Build a **candidate set** first:
   - Files whose names align with **feature module / component** strings from the explore (`spec-<module>-<component>-*.md`).
   - Any spec paths **explicitly named** in the explore doc.
   - Specs that appear in the **Upstream atomic specs** lists of those candidates (transitive closure), up to a **soft cap of 10** files; if you stop early, say which areas were not loaded and why.
   - Prefer the **latest** conflicting spec only when multiple match the same module/component slug; note ambiguity in Important Notes.

Use prior specs for **continuity** (route names, repository contracts, state shapes, prior decisions) and to populate **upstream dependencies**; do not contradict an existing approved spec without calling it out in **Change Summary** and **Important Notes**.

## Granularity (merge, split, balance)

Explore rows are a **starting inventory**, not necessarily one file per row. Adjust grain so a coding agent can produce **one coherent plan** per atomic spec: shippable slice, clear interfaces, testable outcomes.

- **Prefer one atomic spec** when the work shares one **primary user journey**, one **bloc/cubit**, one **feature module**, and would be artificial to split.
- **Prefer multiple atomic specs** when parts ship **independently**, have different **layers/surfaces** (presentation vs data/repository vs platform integration), different **risk or review** boundaries, or when a single file would exceed one plan (e.g. a UI slice + a separate API/data-layer slice + a platform-permission slice).
- **Document the choice** in each spec under **Important Notes** (or **Intent**) with a short **"Grain rationale"**: why this scope is one spec or split, and what is explicitly out of scope for sibling specs.

If explore bundles unrelated work in one row, **split** and cross-link. If explore fragments work always deployed together, **merge** and use internal sections.

## Upstream atomic dependencies

For **each** new or updated atomic spec:

1. Identify **upstream atomic specs** (other `spec-*.md` that must land before this one): shared repository contract, shared route/guard, auth, core DI/network setup, a prerequisite feature. List each with **repository-relative path** and one line of rationale.
2. Identify **external** dependencies (pub packages, backend services, SDKs, platform capabilities) — separate from upstream specs.
3. Use the template structure under **§11 Dependencies** (*Upstream atomic specs* vs *External systems and libraries*). If nothing applies in a subsection, state `None`.
4. **Acyclic rule:** There must be **no cycle** of upstream links among specs produced/updated in this run. If the explore implies a cycle, **stop** and return the cycle plus ask for explore clarification.

Add a short **implementation sequencing** note when upstream specs exist (e.g. "core router + auth repository spec before feature route specs").

## Inputs

- Selected explore file (see above)
- Bootstrap file at `paths.bootstrap_output_file`
- Template at `templates.atomic_spec_template`
- Scoped codebase and prior specs (see **Context to gather**)

## Process

1. Load `paths.config.yaml` and resolve the selected explore file.
2. Verify the hard explore gate on that file only.
3. Apply **Supplemental instructions (editor-maintained)** for this run.
4. Gather context per **Context to gather** (bootstrap, explore, scoped code, capped prior specs).
5. Decide the final **atomic spec inventory** (merge/split per **Granularity**). Map each file to explore rows or merged scope.
6. Update the explore file `## Proposal Status`: set **State** to `in_progress`, **Last updated** to ISO-8601 UTC, clear prior **Generated specs** bullets if replacing a failed run.
7. For each atomic spec, write or **overwrite** a dedicated markdown file under `paths.proposed_output_dir` using a stable naming convention so re-runs are idempotent:
   - `<proposed_output_dir>/spec-<feature_module>-<component>-<slug>.md`
8. Fill all sections from `templates.atomic_spec_template`, using template-derived H2 validation from `workflow.schema.yaml` gate flags, with concrete, plan-ready detail: BLoC/Cubit choice + states/events, domain entities/contracts, data sources/repositories, navigation (go_router) routes/guards, per-platform (web/iOS/Android) behavior, responsiveness, and measurable success criteria with test hooks (bloc_test, widget/golden, integration).
9. In every generated spec, set **Source explore** (`source_explore_path`) to the **repository-relative path** of the selected explore file, and **Feature module** to the `lib/features/<module>` it belongs to.
10. After **all** spec files are written, update the explore file `## Proposal Status`:
    - **State**: `proposed`
    - **Last updated**: ISO-8601 UTC
    - **Generated specs**: bullet list of repository-relative paths to every file written this run (replace the `none` placeholder entirely)
11. If writing fails after at least one spec was written: set **State** to `failed`, **Last updated** to ISO-8601 UTC, **Generated specs** to bullets for files successfully written, add **Notes** with the error; do not set **State** to `proposed`.
12. Confirm count of generated files and list their paths.

## Re-runs

Re-running `propose` on the same explore file **overwrites** existing spec files that use the same derived names. The final `## Proposal Status` → **Generated specs** list must match the full set of files produced in that successful run.

## Required sections per spec

Match `templates.atomic_spec_template` and `workflow.schema.yaml` template-derived H2 gate validation, including:

- 1. Intent
- 2. User Scenarios
- 3. Requirements
- 4. Change Summary
- 5. Experience and Design Constraints
- 6. State Management and Data
- 7. Technical Boundaries
- 8. Platform and Build Targets
- 9. Success Criteria
- 10. Important Notes (include **Grain rationale** when non-obvious)
- 11. Dependencies (**Upstream atomic specs** and **External systems and libraries**)
- 12. Review Checklist

Fill all front-matter-style fields, including **Feature module**, **Target platforms**, and **Source explore**.
