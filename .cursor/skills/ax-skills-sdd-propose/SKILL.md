---
name: ax-skills-sdd-propose
description: Turns a completed explore report into canonical medium-grained spec markdown under paths.proposed_output_dir—scoped, dependency-aware, and sized so a coding agent can plan a meaningful, shippable slice in one document.
---

# Step 3: Propose

## Path and template resolution

1. Read `./.cursor/skills/ax-skills-sdd-workflow/config/paths.config.yaml`.
2. Resolve these keys for all reads and writes (do not hardcode artifact directories):
   - `paths.bootstrap_output_file` — bootstrap context
   - `paths.explore_output_glob` — glob pattern for valid explore artifacts (e.g. `explore-*.md` under the explore directory)
   - `paths.explore_output_dir` — parent directory of explore files (for path checks)
   - `paths.proposed_output_dir` — where spec markdown files are written (also scan here for **prior specs**)
   - `templates.atomic_spec_template` — spec template (repo-relative path under `templates`)

## Selecting the explore input

Resolve **exactly one** explore markdown file using this order:

1. **Explicit path** from the user (message, `@` reference, or clearly indicated open file): use that path if it exists.
2. If the user gave no path and **exactly one** file matches `paths.explore_output_glob`, use that file and state the assumption in the response.
3. If the user gave no path and **zero or multiple** files match `paths.explore_output_glob`, stop and ask which `explore-*.md` to use. Do not pick "latest" by timestamp.

**Path validity:** The chosen file must match `paths.explore_output_glob` (same basename pattern and tree as configured). Reject paths outside that contract.

## Gate

Run `propose` only when explore is complete and valid for the **selected** explore file.

Hard gate requirements:

1. The selected explore file exists and matches `paths.explore_output_glob`.
2. Verify it is a real completed explore output (not a stub).
3. Reject explore files that are placeholders or incomplete (for example only `TBD`, `N/A`, or only open questions without concrete specs).
4. Confirm the explore file includes every mandatory section from `explore-report.md`, using template-derived H2 validation from `workflow.schema.yaml` gate flags, with concrete table rows where applicable (not only placeholders). The `## Proposal status` section must exist; before writing specs, **State** may be `explore-done-tasks-pending`, `task-generation-failed`, or `tasks-generating` (new values), or the legacy values `pending`, `failed`, or `in_progress` from files created before the label rename — all are accepted for backward compatibility.

If any gate check fails, stop immediately and return:

- why explore is considered incomplete
- what must be updated before propose can run

Set `## Proposal status` → **State** to `failed` and **Last updated** to an ISO-8601 UTC timestamp, with a short **Notes** bullet explaining the gate failure (add a `- **Notes**:` line under Proposal status if absent). Do not write or overwrite files under `paths.proposed_output_dir` when gate checks fail.

## Goal

Produce **canonical medium-grained spec files** under `paths.proposed_output_dir`: each file is the single planning artifact a coding agent (Cursor, Claude Code, etc.) should read to **build an implementation plan** for a meaningful, shippable slice — explicit acceptance checks, clear boundaries, concrete data and contract detail, and **ordered dependency** on other specs where applicable.

This step **creates or refreshes** those specs from the selected explore; it does not replace code review or task trackers.

### Sizing target: medium grain

The default size for a spec produced by this skill is **medium**, not minimal. Aim for specs a competent coding agent can plan in one pass and a small team can ship in roughly **a few days to about a week** of focused work — not single-PR micro-tasks, and not multi-week epics.

Concrete targets per spec (use as a guide, not a hard cap):

- **3–8 functional requirements**, each with rationale and an explicit acceptance check (not one-liners).
- **2–5 user scenarios** covering the primary journey plus realistic edge / failure paths.
- **Concrete shapes** in Data and State (named entities, fields, key invariants) and Technical Boundaries (interfaces, modules, integration points) — not placeholder bullets.
- **Real success criteria** that can be verified at review time, not vague aspirations.

If a candidate spec would have only 1–2 trivial FRs, no real scenario beyond the happy path, and no data or boundary detail worth writing — that is a **sub-medium** slice and should be **merged** with related work rather than shipped as its own spec. If a candidate spec balloons past these targets across **unrelated** journeys or surfaces, it is **larger than medium** and should be **split** along the seams described in **Granularity** below.

## Supplemental instructions (editor-maintained)

Maintainers may **edit the bullet list in this section only** to add standing rules for every `propose` run. When executing this skill, treat bullets here as **constraints** on tone and depth. If a bullet conflicts with the selected explore file on **factual scope**, the explore file wins.

- **Default to medium grain.** Prefer fewer, more substantial specs over many tiny ones. When in doubt between merging two related rows or splitting one into pieces, **merge**. Only split when the **Granularity** rules give a concrete reason.
- **Write with depth, not bullet salad.** Every required section should contain real, specific content for this slice. Functional requirements get rationale and an acceptance check. User scenarios cover at least one realistic edge or failure case beyond the happy path. Data and State and Technical Boundaries name actual entities, fields, and interfaces — not placeholders.
- **NFRs stay honest.** Do not inflate non-functional requirements. Add NFRs only when the user or explore explicitly needs them for this slice; otherwise keep that subsection minimal (one line stating no additional NFRs apply, or remove placeholder noise in favor of an honest `N/A`). "More detail" applies to sections that have real content to add — it does not apply to NFRs by default.
- **Refine prior specs, don't restart them.** When a prior spec exists for the same component/subcomponent slug, treat the new spec as a revision of it: preserve names and decisions that still hold, reuse its vocabulary, and call out every real change in **Change Summary** with a reason grounded in the explore or bootstrap. The new spec should read as a sharper version of the prior one, not an unrelated rewrite.
- _(Add more bullets below as needed.)_

## Context to gather (before drafting specs)

Use **all** of the following; narrow reads deliberately so context stays faithful and bounded.

1. **Bootstrap** — Read `paths.bootstrap_output_file` (solution name, project type, scope, actors, tech stack, and any other keys). Use this to ground terminology, stack choices, and scope boundaries.
2. **Selected explore** — Treat tables and narrative (components, subcomponents, new vs changed specs) as the **authoritative backlog** for this run. Every delivered spec must map to explore content (possibly after merge/split).
3. **Source code (scoped)** — For brownfield (and when explore points at modules), read **only** code paths implied by explore + bootstrap: entry files, APIs, migrations, and configs that those rows reference or that obviously implement the named components. Widen only to resolve a concrete ambiguity; record "not searched" gaps in **Important Notes** if time/context would force a blind guess.
4. **Prior specs in `paths.proposed_output_dir`** — Do **not** load every file by default. Build a **candidate set** first:
   - Files whose names align with **component / subcomponent** strings from the explore tables (`spec-<component>-<subcomponent>-*.md` pattern).
   - Any spec paths **explicitly named** in the explore doc.
   - Specs that appear in the **Upstream specs** lists of those candidates (transitive closure), up to a **soft cap of 10** files total for this context pass; if you stop early, say which areas were not loaded and why.
   - Prefer the **latest** conflicting spec only when multiple match the same component slug (same basename family); note ambiguity in Important Notes if versions differ.

Use prior specs as the **baseline to refine against**, not just as background reading. Specifically:

- **Continuity** — preserve names, APIs, data shapes, invariants, and decisions from prior specs unless this run has an explicit reason to change them. Reuse the same vocabulary the prior spec used (entity names, field names, status values) so a reviewer can diff the two cleanly.
- **Refinement, not restart** — if a prior spec covers the same component/subcomponent slug as a spec being produced now, treat the new spec as a **revision**: keep what is still correct, sharpen what was vague, fill what was missing, and remove what is now obsolete. Do not silently rewrite content that the prior spec already settled.
- **Explicit change tracking** — every deviation from a prior spec on the same slug must be called out by name in **Change Summary** (what changed and why) and, when the change affects assumptions a downstream spec or implementer might rely on, also flagged in **Important Notes**. "Why" should reference the explore file or the bootstrap, not just "improved wording."
- **Upstream dependencies** — populate §10 Upstream atomic specs from the prior-spec graph, not from guesses. If a prior spec listed a dependency that is no longer relevant, drop it and say so in Change Summary.
- **Conflict handling** — never contradict an existing approved spec without surfacing the conflict. If the explore implies a contradiction, prefer raising it in Important Notes (and, if material, stopping for clarification) over quietly overwriting the prior decision.

## Granularity (merge, split, balance)

Explore rows are a **starting inventory**, not one file per row. The default this skill targets is **medium grain**: a spec coherent enough to plan in one go, substantial enough to be worth its own review, and bounded enough that one agent can hold it in context.

**Default toward merging.** Combine explore rows into a single spec when they share **any two** of:

- the same **primary user journey**,
- the same **failure domain** or transactional boundary,
- the same **surface** (UI screen, API service, data store, migration),
- the same **review or release** boundary (would ship in the same PR / behind the same flag).

**Split into separate specs** only when there is a concrete reason — at least one of the following:

- Parts can ship **independently** with real value on each side.
- Parts have **clearly different surfaces** (for example a UI flow vs an unrelated background job vs a one-time data migration) that wouldn't sensibly review together.
- Parts have **different risk or review** boundaries (e.g. a security-sensitive change paired with a cosmetic tweak).
- A single spec would cover **more than ~2–3 unrelated primary journeys** or an unbounded FR list — split along the natural journey/surface seams.

**Document the choice** in each spec under **Important Notes** (or **Intent**) with a short **"Grain rationale"** paragraph: which explore rows this spec absorbs, why this scope is one spec or split, and what is explicitly out of scope for sibling specs.

If explore bundles unrelated work in one row, **split** into multiple specs and cross-link dependencies. If explore fragments work that is always deployed together or shares a journey, **merge** into one medium-grained spec and use sections internally to keep it readable.

## Upstream spec dependencies

For **each** new or updated spec:

1. Identify **upstream specs** (other `spec-*.md` files under `paths.proposed_output_dir` that must be implemented, stabilized, or understood **before** this one). List each with **repository-relative path** and **one line of rationale** (shared model, API contract, auth, prerequisite feature, etc.).
2. Identify **external** dependencies (services, libs, env)—separate from upstream specs.
3. Use the template structure under **§10 Dependencies** (*Upstream atomic specs* vs *External systems and libraries*). If nothing applies in a subsection, state `None` instead of invented peers.
4. **Acyclic rule:** There must be **no cycle** of upstream links among specs produced or updated in this run. If the explore text implies a cycle, **stop** and return the cycle plus ask for explore clarification instead of writing contradictory specs.

Add a short **implementation sequencing** note (bullet list or ordered list) when upstream specs exist: what order respects those dependencies.

## Inputs

- Selected explore file (see above)
- Bootstrap file at `paths.bootstrap_output_file`
- Template at `templates.atomic_spec_template` (from `paths.config.yaml`)
- Scoped codebase and prior specs (see **Context to gather**)

## Process

1. Load `paths.config.yaml` and resolve the selected explore file.
2. Verify the hard explore gate on that file only.
3. Apply **Supplemental instructions (editor-maintained)** for this run.
4. Gather context per **Context to gather** (bootstrap, explore, scoped code, capped prior specs).
5. Decide final **spec inventory** for this explore. Apply the **medium-grain default**: start by clustering explore rows into the smallest set of specs that still respects the **Granularity** split rules. For each cluster, sanity-check it against the **Sizing target: medium grain** numbers — merge undersized clusters with related neighbors, split oversized ones along journey/surface seams. Map each final spec to the explore rows it absorbs.
6. Update the explore file `## Proposal status`: set **State** to `tasks-generating`, **Last updated** to ISO-8601 UTC, clear prior **Generated specs** bullets if replacing a failed run (leave **Notes** empty or remove stale notes unless documenting this run).
7. For each spec, write or **overwrite** a dedicated markdown file under `paths.proposed_output_dir` using the same naming convention so re-runs are idempotent:
   - `<proposed_output_dir>/spec-<component>-<subcomponent>-<slug>.md`
   - **Before overwriting**, if a prior spec exists at that path (or at a previous version of that slug from the candidate set), read it first and treat the new spec as a refined revision of it per the **prior specs** guidance above. Carry forward decisions that still hold, sharpen what was vague, and ensure every substantive change is reflected in §4 Change Summary with a reason.
8. Fill all sections from the spec template, using template-derived H2 validation from `workflow.schema.yaml` gate flags, with **concrete, plan-ready detail** at the medium grain described above: real boundaries, named data touchpoints, specific integration points, and measurable success criteria aligned to explore. Do not leave structural placeholders in sections that have real content to add for this slice.
9. In every generated spec, set **Source explore** (`source_explore_path`) to the **repository-relative path** of the selected explore file.
10. After **all** spec files are written successfully, update the explore file `## Proposal status`:
    - **State**: `tasks-generated`
    - **Last updated**: ISO-8601 UTC
    - **Generated specs**: bullet list of repository-relative paths to every file written this run (replace the `none` placeholder entirely)
11. If writing fails after at least one spec was written: set **State** to `task-generation-failed`, **Last updated** to ISO-8601 UTC, **Generated specs** to bullets for files successfully written, and add **Notes** with the error; do not set **State** to `tasks-generated`.
12. Confirm count of generated files and list their paths.

## Re-runs

Re-running `propose` on the same explore file **overwrites** existing spec files that use the same derived names. The final `## Proposal status` → **Generated specs** list must match the full set of files produced in that successful run.

## Required sections per spec

Match `templates.atomic_spec_template` and `workflow.schema.yaml` template-derived H2 gate validation, including:

- 1. Intent
- 2. User Scenarios — primary journey plus at least one realistic edge / failure path.
- 3. Requirements — 3–8 functional requirements as the medium-grain target, each with rationale and an explicit acceptance check.
- 4. Change Summary — when a prior spec exists for the same slug, list the concrete deltas (added / removed / modified) against that prior spec with a one-line reason each, grounded in the explore or bootstrap. When no prior spec exists, state that this is a new spec and summarize what it introduces.
- 5. Experience and Design Constraints
- 6. Data and State — name actual entities, fields, and key invariants relevant to this slice.
- 7. Technical Boundaries — name real interfaces, modules, and integration points.
- 8. Success Criteria — verifiable at review time.
- 9. Important Notes (include **Grain rationale** describing which explore rows this spec absorbs and what is out of scope).
- 10. Dependencies (**Upstream atomic specs** and **External systems and libraries** populated per this skill).
- 11. Review Checklist

Fill all front-matter-style fields in the template, including **Source explore**.