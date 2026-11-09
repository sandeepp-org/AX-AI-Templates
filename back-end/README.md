

## Nexus monorepo

TypeScript monorepo using pnpm workspaces.

### Structure

- `app/` - Application
- `packages/` - Shared packages

### Setup

```bash
pnpm install
```

### Commands

- `pnpm build` - Build all packages
- `pnpm test` - Run tests

### Template / fork workflow

If you created a repo from this template and want to **sync `packages/*` from upstream**, **trim** util packages, or **open a PR** with package-only changes, use the `pnpm template:*` scripts. Copy-paste examples and setup live in **[scripts/template/README.md](scripts/template/README.md)**.

Quick reference:

- `pnpm template:ensure` — pull missing workspace packages from upstream and `pnpm install`
- `pnpm template:remove util-foo …` — remove packages locally and clean `workspace:` refs
- `pnpm template:add …` / `pnpm template:update …` — add or refresh packages from upstream
- `pnpm template:pr <branch> "<message>"` — commit `packages/**`, push, PR to `main`

Configure `scripts/template/upstream.env` from `scripts/template/upstream.env.example` (see that README).
