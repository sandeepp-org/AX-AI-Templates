---
name: ax-skills-sdd-bootstrap
description: Collects and persists base solution context for spec driven development. Use when starting workflow bootstrap or creating/updating sol-bootstrap-config.
note for the skill developer: Do **not** maintain a parallel list of field names in this skill.
---

# Step 1: Bootstrap

## Goal

Create or update `ax-sdd-artifacts/bootstrap/sol-bootstrap-config.yaml`.

## What to collect (source of truth)


1. **All keys and structure** come from the bootstrap config template:
   - `./.cursor/skills/ax-skills-sdd-workflow/templates/sol-bootstrap-config.template.yaml`
   - Treat every **top-level YAML key** in that file as a section to fill (skip comment-only lines).
   - Match value shapes to the template (`""` vs `[]` as shown).

2. **Minimum fields that must be non-empty before explore is allowed** are defined only in the workflow schema (so gates stay in one place):
   - `./.cursor/skills/ax-skills-sdd-workflow/config/workflow.schema.yaml` → `workflow.steps` → step `id: bootstrap` → `gate_validation` (explicit required fields + template-derived gate flags)

Collect values for **every** template key; enforce the schema gate's template-derived minimum non-empty rules before explore.

## Collection Strategy

- Infer candidate values from the source codebase first (languages, frameworks, modules, architecture, domain hints, runtime topology, integration patterns).
- **Ignore non-functional process artifacts** when inferring solution context: cursor rules, skill files, skill templates, generated workflow outputs, and agent/process instructions.
- Ask the user interactive questions for missing/uncertain fields using the template key names and nearby comments as wording guidance.
- Use iterative follow-ups: if the user gives partial answers, ask only for the remaining missing fields and continue until all required gate fields are complete.
- For inferred values, explicitly ask the user to confirm or correct before writing the final config file.

## Process

1. Read `sol-bootstrap-config.template.yaml`.
2. Read `workflow.schema.yaml` bootstrap `gate_validation` for the explore gate minimum.
3. Inspect source code and project manifests to infer draft values for template keys while excluding process artifacts.
4. Ask concise interactive questions for unknown, ambiguous, or unconfirmed fields.
5. If any required gate field remains missing after a user reply, ask iterative follow-up questions only for those gaps.
6. Ask the user to confirm the resolved final values.
7. Write merged output to `ax-sdd-artifacts/bootstrap/sol-bootstrap-config.yaml` (same key set and shapes as the template).
8. Confirm bootstrap completion and indicate the next step is `explore`.

## Validation

- Apply `workflow.schema.yaml` bootstrap `gate_validation`: required keys non-empty, no placeholder values from `reject_placeholder_values` where present.
- List-typed keys from the template must be YAML lists (at least one item where the schema marks them as required for the gate, e.g. `actors`, `tech_stack`).
