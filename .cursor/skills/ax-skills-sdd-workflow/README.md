# Spec Workflow Setup

This project now includes Cursor project skills for a 3-step spec-driven flow:

- `ax-skills-sdd-bootstrap`
- `ax-skills-sdd-explore`
- `ax-skills-sdd-propose`
- `ax-skills-sdd-workflow` (orchestrator)

## Invoke From Cursor Chat

Use prompts like:

- "Run bootstrap for spec workflow"
- "Run explore for spec workflow for <feature/problem/change>"
- "Run propose for spec workflow"
- "Run full spec workflow from current state"

## How To Use Explore

`explore` is an interactive discovery step for new specs (and related add/change/delete impacts to existing specs). It is not a silent one-shot file generation step.

### 1) Start with explicit intent

Provide a clear seed when invoking explore. Good examples:

- "Run explore for spec workflow for role-based access control."
- "Run explore for spec workflow for improving checkout retries."
- "Run explore for spec workflow and suggest new features for onboarding."
- "Run explore for spec workflow from this PRD: @docs/prd-onboarding.md"

If you only say "Run explore for spec workflow" without intent, the agent should ask follow-up questions before creating/updating explore output.

### 2) Bring supporting documents (optional)

Explore can use user-provided files as evidence:

- chat uploads
- explicit file path references in your prompt
- common formats including Markdown, PDF, and Word docs

Example:

- "Run explore for spec workflow for audit logs using @docs/compliance-prd.pdf and @docs/current-architecture.md"

The workflow converts non-markdown docs to markdown using `scripts/convert_to_markdown.py` and grounds exploration in those sources plus bootstrap + code context.

### 3) Expect iterative interaction

During explore, the agent should:

- ask clarification questions
- identify requirement gaps and conflicts
- compare options when needed
- keep tangents as out-of-scope candidate ideas unless you confirm re-scope
- resolve all high-impact open questions before marking explore complete

### 4) Output behavior

Explore works on a single active `explore-*.md` file per session and updates it iteratively. The output is discussion-backed baseline context for `propose`.

When complete, use:

- "Run propose for spec workflow using @ax-sdd-artifacts/explore/explore-YYYYMMDD-HHMMSS.md"

## Customize Workflow

- Change step order, path keys, and gate rules (not document body shape):
  - `./.cursor/skills/ax-skills-sdd-workflow/config/workflow.schema.yaml`
- Change output document structure (sections, tables, bootstrap YAML keys):
  - `./.cursor/skills/ax-skills-sdd-workflow/templates/` (schema points here via `template_path_key`)
- Change default behavior:
  - `./.cursor/skills/ax-skills-sdd-workflow/config/workflow.config.yaml`
- Change output paths and template/script references:
  - `./.cursor/skills/ax-skills-sdd-workflow/config/paths.config.yaml`
- Change document formats:
  - `./.cursor/skills/ax-skills-sdd-workflow/templates/`
