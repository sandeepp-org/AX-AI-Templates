---
name: project-context-sync
description: "Use when: Coder agent completes implementation and before final commit. Scans repo for structural/config changes (new packages, skills, modules, version bumps, build config updates). Auto-updates PROJECT-CONTEXT.md with current state. Warns if sync found inconsistencies. Non-blocking; allows commit but flags for awareness."
metadata:
  version: "1.0"
  trigger: "Pre-commit (run by Coder before commit-policy handoff)"
  runs-as: "Coder subagent"
---

# Project Context Sync

**Use when:** Coder is ready to commit. Ensures **`PROJECT-CONTEXT.md`** reflects current repo state.

**Scope:** Detects structural changes (packages, modules, skills, rules) and config changes (versions, tsconfig, turbo.json, package.json) → auto-updates documentation.

**Philosophy:** Keep **`PROJECT-CONTEXT.md`** as **single source of truth** for repo shape and conventions. Never stale or out-of-sync.

---

## When to Run This Skill

### Automatic Triggers (Always Run Before Committing)

After finishing implementation, Coder should run this skill if ANY of these happened:

- [ ] New package created (`packages/util-*`, `packages/app-*`)
- [ ] Existing package removed or renamed
- [ ] New domain module added (`app/src/<module>/`)
- [ ] New skill created (`.claude/skills/<name>/`)
- [ ] `AGENTS.md` or `PROJECT-CONTEXT.md` changed (keep docs consistent)
- [ ] Version bumps in `package.json` (Node, pnpm, TypeScript, major deps)
- [ ] Changes to `tsconfig.base.json` or package `tsconfig.json` files
- [ ] Changes to `turbo.json` (build pipeline changes)
- [ ] Changes to `jest.config.cjs` or root `package.json` scripts
- [ ] Changes to `.prettierrc` or `eslint.config.js` (formatter/linter rules)
- [ ] Changes to `Dockerfile` or Docker workflow paths

### Manual Triggers

Coder can also request manual sync if:

- User explicitly asks: "sync project context"
- User reports: "project-context is outdated"
- Before major release or team sync

---

## Procedure: Scan → Detect → Update → Warn

### Step 1: Scan Current Repo State

Read these directories and files to capture current state:

```bash
# Packages
find packages -maxdepth 2 -name "package.json" | jq -s '. | map({
  path: .[].path,
  name: .[].package.name,
  version: .[].package.version
})'

# Domains in app
ls -d app/src/*/ 2>/dev/null | grep -v "^app/src/channels\|infrastructure\|shared"

# Skills
ls .claude/skills/*/SKILL.md | xargs -I {} head -1 {}

# Project context (canonical)
head -5 PROJECT-CONTEXT.md

# Versions
jq .engines package.json (Node version)
jq .dependencies.typescript package.json
pnpm --version
```

### Step 2: Build Change Summary

Compare current state to what's documented in **`PROJECT-CONTEXT.md`**. Create a local changelog:

```markdown
## Changes Detected

### Structural Changes

- [x] New package: util-<name> v<version>
- [x] New skill: <name>
- [x] Removed: <old package>

### Config Changes

- [x] TypeScript upgraded: 4.9 → 5.x
- [x] Jest config updated (coverage threshold)
- [x] Turbo pipeline updated (new task: validate)

### No Changes

- Version, monorepo structure stable
```

### Step 3: Auto-Update `PROJECT-CONTEXT.md`

Update these sections in **`PROJECT-CONTEXT.md`**:

#### A. Tech Stack (if versions changed)

```markdown
## Tech Stack

| Tool       | Version   | Purpose         |
| ---------- | --------- | --------------- |
| Node.js    | >= 22.0.0 | Runtime (LTS)   |
| pnpm       | 9.15.0    | Package manager |
| TypeScript | 5.x       | Language        |

...
```

**Action:** Update version columns with `pnpm list`, `node --version`, `jq .engines package.json`

#### B. Project Structure (if packages/modules added/removed)

```markdown
## Project Structure
```

<repo>/
├── .claude/
│ └── skills/ # reusable skills (canonical)
├── app/ # App stub (add your app when forking)
├── docs/ # Project docs
├── packages/ # Add packages as packages/util-<n>/
...

````

**Action:** If new packages added, verify `packages/util-<name>/` follows template. If new modules in app, document under `app/src/`.

#### C. Available Packages (if packages added/removed)

```markdown
## Available Packages

Each package under `packages/` has a `SKILL.md` at its root. **Before writing any new code, check if an existing package covers the need.**

| Package | Purpose | Status |
|---------|---------|--------|
| @util/logger | Application logging | ✓ Stable |
| @util/redis | Session/cache store | ✓ Stable |
| @util/mongodb | MongoDB wrapper | ✓ Stable |
...
````

**Action:** Add new packages to table. Mark status: `✓ Stable` or `⚠ Experimental` or `🚧 In Progress`.

#### D. Skills to Follow (if skills added)

```markdown
**Skills to follow** (skills take priority over this rule on conflict):

| Skill             | When to load                    |
| ----------------- | ------------------------------- |
| **js-code-style** | Any file generation or refactor |
| **js-testing**    | Any test file                   |

...
```

**Action:** Add new skills to table with trigger conditions.

#### E. Turborepo Pipeline (if turbo.json changed)

```markdown
## Turborepo Pipeline (turbo.json)

| Task  | Depends On | Cached | Outputs                 |
| ----- | ---------- | ------ | ----------------------- |
| build | ^build     | Yes    | dist/\*_, _.tsbuildinfo |

...
```

**Action:** Re-run `turbo.json` and sync tasks + dependencies + caching strategy.

#### F. Root package.json Scripts (if scripts changed)

````markdown
## Root package.json Scripts

```json
{
  "build": "turbo build",
  "start": "pnpm --filter app start",
  "test": "turbo test",
  "lint": "turbo lint",
  ...
}
```
````

**Action:** Run `jq .scripts package.json` and update.

#### G. TypeScript Configuration (if tsconfig changed)

```markdown
## TypeScript Configuration

**tsconfig.base.json** (shared):

- `target: ES2022`
- `module: NodeNext`, `moduleResolution: NodeNext`
- `strict: true`
  ...
```

**Action:** Re-read `tsconfig.base.json` and document current config state.

### Step 4: Detect Inconsistencies & Warnings

As you update each section, check for:

| Check                    | Warn If                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Missing SKILL.md**     | New package in `packages/` but no SKILL.md at root                             |
| **Missing README**       | New package or domain module but no README                                     |
| **Mismatched versions**  | `package.json` says `typescript: 5.1` but `tsconfig.base.json` requires `5.2+` |
| **Orphaned skills**      | Skill exists in `.claude/skills/` but not mentioned in PROJECT-CONTEXT      |
| **Config drift**         | `turbo.json` tasks don't match actual package.json scripts                     |
| **Structure violations** | New package not in `packages/util-*` format                                    |

### Step 5: Generate Sync Report

Create or update `docs/project-context-sync-report.md`:

```markdown
# Project Context Sync Report

**Last synced:** <ISO timestamp>
**Triggered by:** <phase + commit hash or task name>
**Status:** ✓ Synced | ⚠ Warnings | ❌ Blockers

## Changes Applied

### Structural Updates

- [x] Added @util/<name> to Available Packages table
- [x] Updated Turborepo Pipeline (new task: validate)

### Config Updates

- [x] TypeScript bumped: 4.9 → 5.1
- [x] pnpm version synced: 8.10 → 9.15
- [x] jest config snapshot updated

## Warnings (Non-Blocking)

- ⚠️ New skill `<name>` created but `PROJECT-CONTEXT.md` already mentions it (no update needed)
- ⚠️ New package `@util/colors` has no README yet (add before publishing)

## Blockers (None)

All structural and config changes synced successfully.

## Recommendation

✓ Safe to commit. **`PROJECT-CONTEXT.md`** now reflects current state.
```

---

## Command: Run This Sync

### From CLI (Coder can run directly)

```bash
# 1. Scan and generate report
node scripts/sync-project-context.js --generate-report

# 2. Review changes
cat docs/project-context-sync-report.md

# 3. If changes look good, commit
git add PROJECT-CONTEXT.md docs/project-context-sync-report.md
git commit -m "chore: sync project-context after new package additions"
```

### From Coder Agent (Before Committing)

```
I've completed implementation. Running project-context sync...

1. Scan repo: packages/, app/src/, .claude/skills/, PROJECT-CONTEXT.md
2. Generate change summary
3. Auto-update: project-context.md
4. Generate: project-context-sync-report.md
5. Report findings

Ready to commit? Generating diff...
```

---

## Integration with Orchestrator Workflow

### When to Run (Phase B → Phase C)

```
Phase B: Implementation Complete
  ↓
Coder finishes all changes
  ↓
[RUN THIS SKILL] project-context-sync
  ↓
  Step 1: Scan repo for changes
  Step 2: Update project-context.md
  Step 3: Generate sync report
  Step 4: Report any warnings
  ↓
Coder proceeds to commit-policy
  ↓
Phase C: Completion (Review-gate validates)
```

**In orchestrator flow:**

1. Coder implements per plan
2. **Coder runs project-context-sync** (this skill)
3. Coder loads `commit-policy` skill
4. Coder commits with proper message
5. Review-gate validates (including that project-context is now in sync)
6. Phase complete

---

## What Gets Updated Automatically

### ✅ Always Synced

- [ ] Tech Stack versions (Node, pnpm, TypeScript, major deps)
- [ ] Project Structure (folder layout)
- [ ] Available Packages table
- [ ] Skills to Follow table
- [ ] Turborepo Pipeline (if turbo.json changed)
- [ ] Root package.json Scripts
- [ ] TypeScript Configuration
- [ ] Rules vs Skills distinction

### ⚠️ Warned But Not Auto-Changed

- Missing SKILL.md for new packages
- Missing README for new packages
- New domain modules in app not following DDD pattern
- Mismatched version constraints
- Orphaned skills or rules

### ❌ Never Automated

- Philosophy section (requires conceptual review)
- Env From App section (infrastructure policy, not auto-detectable)

---

## Warnings & Non-Blocking Alert Format

```markdown
## ⚠️ Warnings (Review These)

1. **Missing SKILL.md** — `packages/util-colors/`
   → Action: Run `cp .claude/skills/js-package-scaffold/template/SKILL.md packages/util-colors/SKILL.md`
   → Then re-run sync

2. **Config Mismatch** — `tsconfig.base.json` says `target: ES2022` but Dockerfile builds with `node:20` (ES2020 support)
   → Action: Update `tsconfig.base.json` to `ES2020` or upgrade Docker to `node:22`
   → Or explicitly document this constraint

3. **Orphaned Skill** — `.claude/skills/future-skill/SKILL.md` exists but not in **`PROJECT-CONTEXT.md`**
   → Action: Add to "Skills to Follow" table or remove the skill folder

## ✓ All Other Checks Passed
```

---

## Checklist: Before Committing (Coder Uses This)

- [ ] Run `project-context-sync` skill
- [ ] Review `project-context-sync-report.md` for warnings
- [ ] Address blockers (if any) **before** committing
- [ ] Warnings are non-blocking; document in commit message if needed
- [ ] Load `commit-policy` skill
- [ ] Commit with proper message
- [ ] Push for review-gate validation

---

## Exit Criteria

This skill is done when:

- ✅ **`PROJECT-CONTEXT.md`** is current (matches repo state)
- ✅ `docs/project-context-sync-report.md` generated with findings
- ✅ All blockers resolved OR documented with action items
- ✅ Warnings listed but not blocking commit
- ✅ Coder ready to proceed to `commit-policy`

---

## Examples

### Example 1: New Package Added

```
Coder: I added packages/util-colors/. Running sync...

Step 1: Scan
  → Found new package: @util/colors v1.0.0
  → Found SKILL.md ✓
  → Found README.md ✓

Step 2: Update project-context.md
  → Added to "Available Packages" table ✓
  → Entry: @util/colors | Color utilities for CLI | ✓ Stable

Step 3: Report
  ✓ All checks passed
  Ready to commit
```

### Example 2: Version Bump + New Skill

```
Coder: Updated TypeScript + added a new skill. Running sync...

Step 1: Scan
  → TypeScript: 4.9 → 5.1
  → New skill: .claude/skills/<name>/SKILL.md

Step 2: Update project-context.md
  → Tech Stack table: TypeScript 5.x ✓
  → Skills table: Added <name> with trigger ✓

Step 3: Report
  ⚠️ Warning: tsconfig.base.json still says target: ES2020
  → Recommend updating to ES2022 (TypeScript 5.1 supports it)

  ✓ Non-blocking. Ready to commit.
```

### Example 3: Config Drift Detected

```
Coder: Modified turbo.json. Running sync...

Step 1: Scan
  → turbo.json: new task "validate" added
  → "validate" task: depends on [build], caches: true, outputs: reports/*

Step 2: Update project-context.md
  → Turborepo Pipeline table: Added "validate" task ✓

Step 3: Report
  ⚠️ Warning: "validate" task not in root package.json scripts
  → Action: Run `pnpm install` to sync? Or intentional (turbo-only task)?

  ✓ Non-blocking. Document decision in commit message if intentional.
```

---

## Helper Script (Optional)

If you want deterministic scanning, create `scripts/sync-project-context.js`:

```javascript
#!/usr/bin/env node

/**
 * Scans repo and auto-syncs project-context.md
 * Usage: node scripts/sync-project-context.js --generate-report
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function scanPackages() {
  // Find all packages/*/package.json
  const packages = execSync('find packages -maxdepth 2 -name "package.json"')
    .toString()
    .trim()
    .split("\n")
    .map((p) => {
      const pkg = JSON.parse(fs.readFileSync(p));
      return { path: p, name: pkg.name, version: pkg.version };
    });
  return packages;
}

function scanSkills() {
  // Find all .claude/skills/*/SKILL.md
  const skills = execSync("ls -d .claude/skills/*/")
    .toString()
    .trim()
    .split("\n")
    .filter((s) => fs.existsSync(path.join(s, "SKILL.md")))
    .map((s) => path.basename(s));
  return skills;
}

function generateReport() {
  const packages = scanPackages();
  const skills = scanSkills();
  const report = {
    timestamp: new Date().toISOString(),
    packages: packages.map((p) => ({ ...p })),
    skills: skills,
  };
  return report;
}

if (process.argv.includes("--generate-report")) {
  const report = generateReport();
  console.log(JSON.stringify(report, null, 2));
}
```

---

## Related Skills & References

- **commit-policy** — loads after this skill (final commit message formatting)
- **js-package-scaffold** — when new packages added, ensures structure follows template
- **`PROJECT-CONTEXT.md`** — the file this skill keeps in sync (source of truth)

---

## Troubleshooting

**Q: Sync says "blocker" — should I fix before committing?**

**A:** YES. Blockers are structural issues (missing files, config drift). Fix them, re-run sync, verify it passes before committing.

---

**Q: Sync says "warnings" — should I fix before committing?**

**A:** NO. Warnings (missing README, version recommendations) are non-blocking. Document them in commit message if relevant, but safe to commit.

---

**Q: What if I'm just fixing a bug (no structural changes)?**

**A:** Run sync anyway (takes ~10 seconds). If no changes detected, sync report will say "✓ No changes" and you're done.

---

**Q: Can I skip this skill?**

**A:** Technically yes, but then project-context gets stale. Review-gate may flag this in code-review. Better to run it; it's fast.

---

**Q: What if project-context has merge conflicts?**

**A:** Rare. If it does:

1. Pull latest
2. Re-run sync (regenerates from current state)
3. Commit the freshly synced version
4. Done
