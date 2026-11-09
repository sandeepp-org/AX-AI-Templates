# Template workflow (forks & upstream packages)

Use these shell scripts when this repo is your **template**: you work in a **clone**, pull util packages from the **canonical repo** (`upstream`), or open PRs with only `packages/**` changes.

**Requirements:** `git`, `jq`, `pnpm` on your PATH. Optional: [GitHub CLI](https://cli.github.com/) (`gh`) to create PRs automatically.

## 1. Point at upstream (one-time)

```bash
cp scripts/template/upstream.env.example scripts/template/upstream.env
```

Edit `scripts/template/upstream.env`:

```bash
UPSTREAM_URL="https://github.com/OWNER/nexus.git"
UPSTREAM_REF="main"
```

Alternatively set `git remote add upstream https://github.com/OWNER/nexus.git` — scripts read that if `UPSTREAM_URL` is unset.

`upstream.env` is gitignored; do not commit secrets there.

### Particular “version” of packages (Git ref, not npm semver)

Workspace packages here use `workspace:*` in the monorepo; there is **no `@util/*` version on npm** unless you publish them yourself. To track a **specific snapshot** of the template, everything that clones from upstream uses **`UPSTREAM_REF`** — any Git **branch**, **annotated/lightweight tag**, or **commit SHA** that exists on `UPSTREAM_URL`.

| What you want                                        | What to do                                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stay on moving `main`                                | `UPSTREAM_REF="main"` (default). Run `pnpm template:update util-foo …` or `pnpm template:ensure` when you want to match upstream again.                |
| Pin to a **release tag** (recommended for stability) | Set `UPSTREAM_REF="v1.2.0"` (or your repo’s tag name). Then `pnpm template:add` / `template:update` / `template:ensure` copy trees **as of that tag**. |
| Pin to an exact **commit**                           | Set `UPSTREAM_REF="abc1234"` (full or short SHA your remote accepts). Same workflow as a tag.                                                          |
| One-off without editing the file                     | `UPSTREAM_REF="v1.2.0" pnpm template:update util-logger util-redis`                                                                                    |

Updating to a **newer** snapshot: bump `UPSTREAM_REF` in `upstream.env` (e.g. `v1.2.0` → `v1.3.0` or back to `main`), then run `pnpm template:update …` for the packages you care about (or `pnpm template:ensure` to fetch anything still missing at that ref).

**Template maintainer habit:** tag the template repo when `@util/*` are in a good state (`git tag v1.2.0 && git push origin v1.2.0`) so forks can pin reliably.

## 2. Commands (from repo root)

| Goal                                                                                        | Command                                                                      |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Restore missing `packages/*` for every `@util/*` + `workspace:*` in the repo                | `pnpm template:ensure`                                                       |
| Remove util packages you do not need (blocked if mandatory or still referenced)             | `pnpm template:remove util-redis util-mongodb`                               |
| Add util packages from upstream (auto-installs util dependencies; optional link into `app`) | `pnpm template:add util-redis` / `pnpm template:add --link-app util-mongodb` |
| Replace local util trees with upstream (discards local edits in those dirs)                 | `pnpm template:update util-logger`                                           |
| Commit `packages/**`, push to `origin`, open PR to `main` (or print compare URL)            | `pnpm template:pr my-branch "feat(util): ..."`                               |

Direct shell (same behavior):

```bash
bash scripts/template/ensure-workspace-packages.sh
bash scripts/template/remove-packages.sh util-secret-manager-aws
bash scripts/template/add-packages-from-upstream.sh --link-app util-redis
bash scripts/template/update-packages-from-upstream.sh util-logger
bash scripts/template/contribute-package-pr.sh my-branch "chore(util): sync from template"
```

`-h` / `--help` on each script prints usage.

## 3. Example scenarios

**Slim clone — drop packages you do not use**

```bash
pnpm template:remove util-secret-manager-aws util-mongodb
# Removes those folders and every workspace: ref to @util/secret-manager-aws and @util/mongodb,
# then pulls any still-missing @util/* deps from upstream and runs pnpm install.
```

**Re-add a missing folder after someone deleted it on disk**

```bash
pnpm template:ensure
```

**Bring back a package that was never in this fork**

```bash
pnpm template:add --link-app util-redis
```

**Reset a package to match upstream `main`**

```bash
pnpm template:update util-api-server
```

**Contribute changes under `packages/` to the template**

```bash
# edit packages only …
pnpm template:pr fix/util-logger-context "fix(logger): correct context propagation"
```

If `gh` is installed and authenticated, a PR may open automatically; otherwise the script prints a GitHub compare URL with base `main`.

## 4. Safety

- Scripts **never push to upstream `main`** by default; they **read** from upstream for copies and target **`main`** only as the PR base.
- **`remove-packages`** only changes **your clone**, not the remote template.
- Remove is **dependency-aware by default**: it fails when a kept package/app still references the package via `workspace:*`.
- Mandatory package guardrails come from `scripts/template/package-policy.json` (`mandatoryPackages` list).
- When remove is blocked due to active dependency usage, the package is automatically added to `mandatoryPackages`.
- Use `pnpm template:remove --force util-foo` only when you intentionally want to bypass those safeguards.
