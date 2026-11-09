---
name: commit-policy
description: "Use when preparing a commit, opening a PR, finalizing staged changes, or anything that ends with `git commit`. Enforces commit message format, scope, pre-commit hygiene (typecheck, lint, tests run), and PR-ready checks. Triggers on commit, PR, push, ship it, finalize, wrap up."
---

# Commit Policy Skill

Use when preparing commits or PR-ready changes.

## Rules

- Never commit secrets or credential files.
- Keep commits scoped to one logical change.
- Use message text that explains why, not only what.
- Run relevant checks before proposing completion.
- Do not amend or force-push unless explicitly requested.
