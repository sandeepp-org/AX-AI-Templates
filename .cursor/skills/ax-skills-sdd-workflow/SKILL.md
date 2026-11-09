---
name: ax-skills-sdd-workflow
description: Orchestrates a three-step spec driven workflow (bootstrap, explore, propose) with mandatory gates, customizable schema, and reusable templates. Use when the user asks to run or customize a spec workflow.
---

# Spec Driven Workflow Orchestrator

Use this skill to run an end-to-end workflow with strict ordering:

1. `bootstrap`
2. `explore` (requires bootstrap output)
3. `propose` (requires explore output)

## Canonical Files

- Workflow schema: `./.cursor/skills/ax-skills-sdd-workflow/config/workflow.schema.yaml`
- Workflow config: `./.cursor/skills/ax-skills-sdd-workflow/config/workflow.config.yaml`
- Path config: `./.cursor/skills/ax-skills-sdd-workflow/config/paths.config.yaml`
- Templates: `./.cursor/skills/ax-skills-sdd-workflow/templates/`
- Optional helper scripts: `./.cursor/skills/ax-skills-sdd-workflow/scripts/`

## Execution Rules

1. Read `workflow.config.yaml` and `paths.config.yaml` first.
2. Enforce hard step gates from `workflow.schema.yaml`:
   - Apply template-derived bootstrap non-empty validation and placeholder rejection before `explore`.
   - Apply template-derived explore/atomic markdown section validation and placeholder rejection before and during `propose`.
   - Do not run `propose` unless a **chosen** explore output is complete (not placeholder/incomplete): the user should pass a specific `explore-*.md` path, or if exactly one file matches `paths.explore_output_glob` in `paths.config.yaml`, that file may be used when the user did not specify one.
3. Always write outputs to paths from `paths.config.yaml`.
4. Use templates from `templates/` when generating documents.
5. If user provides docs as context, convert to markdown with `scripts/convert_to_markdown.py` before requirement extraction.
6. If a gate fails, stop and return actionable remediation steps; do not create downstream artifacts.

## Step Routing

- If user says "bootstrap", apply `ax-skills-sdd-bootstrap`.
- If user says "explore", apply `ax-skills-sdd-explore`.
- If user says "propose", apply `ax-skills-sdd-propose`.
- If user says "run workflow", determine next required step by checking existing outputs.

## Output Contract

Resolve paths from `paths.config.yaml`:

- Bootstrap output file (required): `paths.bootstrap_output_file`
- Explore output file (required): under `paths.explore_output_dir`, named like `explore-YYYYMMDD-HHMMSS.md` (see `paths.explore_output_glob`; same stamp shape as `scripts/make_explore_filename.py`). The Forge app may **pre-create** this file and pin it via `using @…` on the explore CLI — see `ax-skills-sdd-explore` step 4.
- Propose output files (required): one markdown per atomic spec under `paths.proposed_output_dir`

## Customization Notes

- **Output layout** (markdown sections, YAML keys for bootstrap): edit templates under `templates/` and paths in `paths.config.yaml`. The workflow schema references those templates via `template_path_key` — do not duplicate full field lists in the schema.
- **Workflow graph** (step order, path keys, machine gates): edit `workflow.schema.yaml`.
- **Directories and template file paths**: edit `paths.config.yaml`.
