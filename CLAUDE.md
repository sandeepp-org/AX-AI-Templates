@AGENTS.md

# Claude Code workflow

This file is loaded automatically by Claude Code at session start. The skill index, hard routing rules, and links to every skill body live in `AGENTS.md` (imported above). Skill bodies live at `.claude/skills/<name>/SKILL.md` and are auto-discovered by the harness via their YAML `name`/`description` frontmatter.

## Skill loading discipline

- Before writing any code, check the hard routing rules in `AGENTS.md`. If the task touches **business logic**, **packages**, **JS/TS code**, **backend tests**, **frontend tests**, **frontend code**, **component accessibility**, **component documentation**, **frontend testing**, **review**, **commits**, or **Docker**, open the matching skill under `.claude/skills/` and follow it.
- Skills are not optional. If a skill applies and you skip it, the change is incomplete.
- The Cursor copy of every skill lives at `.cursor/skills/<name>/SKILL.md`. When you edit a skill, update both copies.

## Pipeline

1. Implement directly per the hard routing rules in `AGENTS.md`; run typecheck, lint, real-DB backend tests, and Playwright frontend tests; then run `code-review` scoped to the changed packages.
2. Before commit: run `project-context-sync`, then follow `commit-policy`.
