# sdd-scaffold — agent guidance

**Cursor** applies nested `AGENTS.md` when Agent works on files under this app ([docs](https://cursor.com/docs/rules)). **Claude Code** reads `CLAUDE.md`, which imports this file via `@AGENTS.md`, so both editors share one source ([docs](https://code.claude.com/docs/en/memory)).

Skill bodies live directly inside each editor's skills folder — `.claude/skills/<name>/SKILL.md` for Claude Code and `.cursor/skills/<name>/SKILL.md` for Cursor. The two trees are intentional duplicates; **edit both when changing a skill**.

## Hard routing rules (apply before writing any code)

These rules are non-negotiable. Read the linked skill before producing code that touches the relevant surface.

1. **Business / product logic → `app/src/<module>/`** following the DDD + hexagonal layout in [`ddd-package-selector`](.claude/skills/ddd-package-selector/SKILL.md). Module folders: `entities/`, `domain/`, `ports/`, `schemas/`, `service/`, plus `channels/http/`, `infrastructure/`, `shared/` at app level. No domain logic inside route handlers, infrastructure adapters, or `shared/`.
2. **Reusable technical code → `packages/@util/*`** (no exceptions for backend). Before creating a package, read [`ddd-package-selector`](.claude/skills/ddd-package-selector/SKILL.md) Step 3 to scan `packages/` for an existing match, then [`js-package-scaffold`](.claude/skills/js-package-scaffold/SKILL.md) and [`js-package-checklist`](.claude/skills/js-package-checklist/SKILL.md). If an existing `@util/*` package covers 80%+ of the need, extend it instead of building new. Every package must satisfy the full checklist (name `@util/*`, scripts, `SKILL.md`, `README.md`, public-API class with functional helpers).
3. **All JS/TS code** follows [`js-code-style`](.claude/skills/js-code-style/SKILL.md) — arrow functions, no nested functions, no hardcodes, named imports, kebab-case filenames, function comments.
4. **Backend tests** follow [`js-testing`](.claude/skills/js-testing/SKILL.md) — zero mocking, real implementations against a dedicated test database; co-located `*.test.ts` files; happy + edge + lifecycle coverage.
5. **Frontend tests** follow [`frontend-testing`](.claude/skills/frontend-testing/SKILL.md) — end-to-end Playwright against a real running app. No JSDOM-only unit tests for UI flows, no mocking of routers/stores/HTTP clients, no snapshot-only "renders" tests. Required coverage: happy path + validation errors + loading/empty + auth boundary + navigation + accessibility + mobile.
6. **Frontend code** follows [`frontend-architecture`](.claude/skills/frontend-architecture/SKILL.md) — component segregation, state management layering, mobile-first design, theme/Tailwind discipline, custom hooks for code reuse, business logic separation from UI, pixel-perfect design, package structure for reusability.
7. **Reusable component packages** follow [`frontend-a11y`](.claude/skills/frontend-a11y/SKILL.md) for WCAG compliance + keyboard navigation, and [`frontend-component-documentation`](.claude/skills/frontend-component-documentation/SKILL.md) for Storybook, JSDoc, README, accessibility docs.
8. **Reviews** use [`code-review`](.claude/skills/code-review/SKILL.md). **Commits** use [`commit-policy`](.claude/skills/commit-policy/SKILL.md). **Docker** changes use [`docker-guide`](.claude/skills/docker-guide/SKILL.md). **Pre-commit context refresh** uses [`project-context-sync`](.claude/skills/project-context-sync/SKILL.md).

If a task touches one of these surfaces and you do not follow the linked skill, treat the change as incomplete.

## Skills

| Skill | Claude Code | Cursor |
| ----- | ----------- | ------ |
| `code-review` | [`.claude/skills/code-review/SKILL.md`](.claude/skills/code-review/SKILL.md) | [`.cursor/skills/code-review/SKILL.md`](.cursor/skills/code-review/SKILL.md) |
| `commit-policy` | [`.claude/skills/commit-policy/SKILL.md`](.claude/skills/commit-policy/SKILL.md) | [`.cursor/skills/commit-policy/SKILL.md`](.cursor/skills/commit-policy/SKILL.md) |
| `ddd-package-selector` | [`.claude/skills/ddd-package-selector/SKILL.md`](.claude/skills/ddd-package-selector/SKILL.md) | [`.cursor/skills/ddd-package-selector/SKILL.md`](.cursor/skills/ddd-package-selector/SKILL.md) |
| `docker-guide` | [`.claude/skills/docker-guide/SKILL.md`](.claude/skills/docker-guide/SKILL.md) | [`.cursor/skills/docker-guide/SKILL.md`](.cursor/skills/docker-guide/SKILL.md) |
| `frontend-a11y` | [`.claude/skills/frontend-a11y/SKILL.md`](.claude/skills/frontend-a11y/SKILL.md) | [`.cursor/skills/frontend-a11y/SKILL.md`](.cursor/skills/frontend-a11y/SKILL.md) |
| `frontend-architecture` | [`.claude/skills/frontend-architecture/SKILL.md`](.claude/skills/frontend-architecture/SKILL.md) | [`.cursor/skills/frontend-architecture/SKILL.md`](.cursor/skills/frontend-architecture/SKILL.md) |
| `frontend-component-documentation` | [`.claude/skills/frontend-component-documentation/SKILL.md`](.claude/skills/frontend-component-documentation/SKILL.md) | [`.cursor/skills/frontend-component-documentation/SKILL.md`](.cursor/skills/frontend-component-documentation/SKILL.md) |
| `frontend-testing` | [`.claude/skills/frontend-testing/SKILL.md`](.claude/skills/frontend-testing/SKILL.md) | [`.cursor/skills/frontend-testing/SKILL.md`](.cursor/skills/frontend-testing/SKILL.md) |
| `js-code-style` | [`.claude/skills/js-code-style/SKILL.md`](.claude/skills/js-code-style/SKILL.md) | [`.cursor/skills/js-code-style/SKILL.md`](.cursor/skills/js-code-style/SKILL.md) |
| `js-package-checklist` | [`.claude/skills/js-package-checklist/SKILL.md`](.claude/skills/js-package-checklist/SKILL.md) | [`.cursor/skills/js-package-checklist/SKILL.md`](.cursor/skills/js-package-checklist/SKILL.md) |
| `js-package-scaffold` | [`.claude/skills/js-package-scaffold/SKILL.md`](.claude/skills/js-package-scaffold/SKILL.md) | [`.cursor/skills/js-package-scaffold/SKILL.md`](.cursor/skills/js-package-scaffold/SKILL.md) |
| `js-testing` | [`.claude/skills/js-testing/SKILL.md`](.claude/skills/js-testing/SKILL.md) | [`.cursor/skills/js-testing/SKILL.md`](.cursor/skills/js-testing/SKILL.md) |
| `project-context-sync` | [`.claude/skills/project-context-sync/SKILL.md`](.claude/skills/project-context-sync/SKILL.md) | [`.cursor/skills/project-context-sync/SKILL.md`](.cursor/skills/project-context-sync/SKILL.md) |

## Workflow

1. Implement directly per the hard routing rules above; run typecheck, tests (real DB for backend, Playwright for frontend), and lint; then run `code-review` scoped to the changed packages.
2. Before commit, run `project-context-sync` and follow `commit-policy`.
