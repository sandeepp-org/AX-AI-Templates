---
name: js-package-scaffold
description: "MANDATORY when creating any new utility package under packages/util-*. Use whenever backend code is technical/reusable: logger, HTTP client, DB wrapper, validator, retry, cache, secrets, parser, formatter, crypto, queue, rate limiter, config loader, etc. Defines folder layout (src/{interfaces,types,config,constants,helpers,<main-class>,index}.ts), public-class wraps-library pattern (singleton/static/instance), tests (co-located, real execution), and docs (README.md, SKILL.md). Triggers on new package, build a util, create a wrapper, vendor a library, share between services."
metadata:
  version: "1.1"
---

# Scaffolding a New Utility Package

Follow this skill whenever you create a new `util-*` package inside `packages/`. It codifies the folder layout, file conventions, public API class pattern, and docs registration used across the monorepo.

**Prerequisites** — also follow these skills for every file you generate:

- **js-code-style** — arrow functions, consolidated exports, type export/import separation, import ordering, no emojis, no hardcoded values, focused classes.
- **js-code-style helpers** — use `js-code-style/helpers/js-naming-conventions.md` for naming conventions (kebab-case files/folders, PascalCase classes/types, camelCase functions/variables, UPPER_SNAKE_CASE constants).
- **js-testing** — zero mocking, real execution, co-located test files, explicit assertions.

> The rules from those skills are not repeated here. Load them when generating any file.

---

## 1. Folder Structure

Use `util-<name>` as the package directory name. The canonical layout:

```
packages/util-<name>/
  src/
    helpers/                # internal helper modules (not part of public API)
      <helper-name>.util.ts
      <helper-name>.util.test.ts
    <sub-feature>/          # optional sub-feature folders (e.g. transports/, adapters/)
      <module>.ts
      <module>.test.ts
    interfaces.ts           # mandatory package contracts/interfaces for public API boundaries
    constants.ts            # package-level constants (UPPER_SNAKE_CASE)
    config.ts               # typed config normalization (no dotenv; app/test passes values in)
    types.ts                # all public + internal types, exported with `export type`
    <main-class>.ts         # the public interface class
    <main-class>.test.ts    # co-located test file
    index.ts                # barrel -- re-exports public API
  test.env                  # optional app/test bootstrap inputs (never loaded by package code)
  tsconfig.json             # TypeScript config
  package.json              # npm metadata, scripts, deps
  SKILL.md                  # agent skill for vendoring this package
  README.md                 # human-readable docs and API reference
```

All source code lives under `src/`. Tests are co-located next to their source module.

### Build order

Standard build order for a `util-*` package:

1. **Scaffold** — `package.json`, `tsconfig.json`, `interfaces.ts`, `types.ts`, `constants.ts`, `config.ts`, `index.ts` skeleton
2. **Core implementation** — Main class, all public methods, helpers in `src/helpers/`
3. **Tests** — All test files (happy path, edge, lifecycle, per-transport, per-method, child/scoped)
4. **Docs and polish** — `README.md` (full API table, config ref), `SKILL.md`

Run `code-review` once the package is implementation-complete and resolve `[high]`/`[med]` findings before opening a PR.

### Test coverage expectations

Tests must cover at minimum:

- **Lifecycle** — `create()` valid input → instance; `getInstance()` before `create()` → throws; `getInstance()` after `create()` → same instance; `close()` cleans up and clears singleton; `create()` after `close()` → reinitializes
- **Per feature** — happy path + edge cases for each public surface (transports, adapters, sub-features)
- **Per error path** — wrong inputs, connection failures, etc. → expected error
- **Child / scoped instances** (if applicable) — child inherits parent config; child bindings do not affect parent

---

## 2. Public Interface Class

Every package exposes **one primary class** as its public API. The class wraps the underlying library so consumers never import or depend on the library directly.

### Pattern Selection

Choose the right pattern based on the utility's nature:

| Pattern                 | When to use                                                      | Example                                       |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| **Singleton + factory** | Shared stateful resource where singleton is explicitly justified | `Logger.create()`, `Logger.getInstance()`     |
| **Static-only**         | Stateless utilities (hashing, encoding, validation)              | `Crypto.hash(data)`, `Validator.isEmail(val)` |
| **Instance-based**      | Each consumer needs independent state (HTTP clients, builders)   | `new HttpClient(baseUrl)`                     |

### Class Template (singleton + factory)

```typescript
import type { <Name>Config } from "./types";

class <Name> {
  static #instance: <Name> | null = null;

  #underlyingLib: UnderlyingLibType;

  private constructor(lib: UnderlyingLibType) {
    this.#underlyingLib = lib;
  }

  static create(config?: <Name>Config): <Name> {
    // Simple wiring is fine here; extract to helpers if setup exceeds ~20 lines
    const instance = new <Name>(lib);
    <Name>.#instance = instance;
    return instance;
  }

  static getInstance(): <Name> {
    if (<Name>.#instance === null) {
      throw new Error("<Name> not initialized. Call <Name>.create() first.");
    }
    return <Name>.#instance;
  }

  close = async (): Promise<void> => {
    if (<Name>.#instance === this) {
      <Name>.#instance = null;
    }
    // flush, drain, cleanup #underlyingLib ...
  };

  // public methods that delegate to #underlyingLib ...
}

export { <Name> };
```

### Class Template (static-only)

```typescript
class <Name> {
  private constructor() {}

  static someMethod = (input: InputType): OutputType => {
    // delegate to underlying library
  };
}

export { <Name> };
```

### Class Template (instance-based)

```typescript
import type { <Name>Config } from "./types";

class <Name> {
  #underlyingLib: UnderlyingLibType;

  constructor(config: <Name>Config) {
    this.#underlyingLib = buildLib(config);
  }

  // public methods that delegate to #underlyingLib ...
}

export { <Name> };
```

### Key Rules

- The underlying library is stored in a **private field** (`#field`). Consumers never access it.
- All public methods use your own types from `types.ts` — not the library's types — so you can swap the library without breaking consumers.
- If the class needs cleanup (connections, timers), expose `close(): Promise<void>` and/or `flush(): Promise<void>`.
- If the class supports scoped children (e.g. request-scoped loggers), expose `child(bindings): <Name>`.
- Class methods may contain straightforward logic. Extract to `helpers/` when a method exceeds ~20 lines or the logic is reusable. See **js-code-style** → `structure-and-constants.md` for the full rule.

**Additional design patterns:** If you need other patterns (Adapter, Factory, Decorator, etc.), see `helpers/design-patterns.md` in this package.

---

## 3. File Conventions

### `src/constants.ts`

All package-level constants. Values must be `UPPER_SNAKE_CASE`. Export block at the end.

```typescript
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POOL_SIZE = 10;

export { DEFAULT_TIMEOUT_MS, DEFAULT_MAX_RETRIES, DEFAULT_POOL_SIZE };
```

### `src/config.ts`

Defines typed config normalization for package inputs. Package code must not load environment files directly.

```typescript
import type { <Name>Config } from "./types";

const create<Name>Config = (input: Partial<<Name>Config> = {}): <Name>Config => {
  return {
    // defaults + validated input fields
    ...input,
  } as <Name>Config;
};

export { create<Name>Config };
```

### `src/types.ts`

All types live here. Public config types, internal types, discriminated unions — everything. Use `export type { ... }` at the end.

```typescript
type <Name>Config = {
  // consumer-facing config
};

type InternalOptions = {
  // internal-only types
};

export type { <Name>Config, InternalOptions };
```

### `src/interfaces.ts` (mandatory)

Use this file for package contracts (interfaces/type aliases used as API boundaries), including main class/module contracts where applicable.

```typescript
type I<Name> = {
  // public contract for class/module surface
};

type I<Name>Module = {
  create: (config: <Name>Config) => I<Name>;
};

export type { I<Name>, I<Name>Module };
```

### `src/index.ts` (barrel)

Re-exports the public class and public types. Keep it minimal — only export what consumers need.

```typescript
import { <Name> } from "./<main-class>";

import type { <Name>Config, SomePublicType } from "./types";

export { <Name> };

export type { <Name>Config, SomePublicType };
```

### `src/helpers/`

Internal utilities that support the main class. Helpers are **functional** — pure functions (arrow functions), no classes. Each helper gets its own file and co-located test. Helpers are **not** re-exported from `index.ts`.

```
src/helpers/
  build-targets.util.ts
  build-targets.util.test.ts
  parse-options.util.ts
  parse-options.util.test.ts
```

---

## 4. Configuration Files

### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

### Test runner

Packages use the **root Jest config** (`jest.config.cjs`). No package-level Jest config.

```bash
jest --config ../../jest.config.cjs --testPathPatterns="packages/util-<name>"
```

### `test.env`

```env
# Optional input values for app/test bootstrap (not loaded by package code)
```

### `package.json`

```json
{
  "name": "@util/<name>",
  "version": "0.1.0",
  "type": "module",
  "description": "<Short description>",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc --build",
    "test": "jest --config ../../jest.config.cjs --testPathPatterns=\"packages/util-<name>\"",
    "test:watch": "jest --config ../../jest.config.cjs --testPathPatterns=\"packages/util-<name>\" --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^25.0.0",
    "@types/jest": "^30.0.0",
    "typescript": "^5.9.0",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.0"
  }
}
```

---

## 5. Package SKILL.md

Every package gets its own `SKILL.md` at the package root. Follow this template:

````markdown
---
name: util-<name>
description: <One-line description of what the package does and when to use it.>
metadata:
  version: "0.1.0"
  repo: <repo-url>
  path: packages/util-<name>
  dest: packages/util-<name>
---

# @util/<name>

<One-line summary.>

For full API reference see [README.md](./README.md).

## When to Use

Vendor this package when the user needs:

- <capability 1>
- <capability 2>

## Vendoring

```bash
PACKAGE_REF="<git-tag-or-main>"
TMPDIR=$(mktemp -d)
git clone --depth 1 --branch "$PACKAGE_REF" --filter=blob:none --sparse \
  <repo-url> "$TMPDIR"
cd "$TMPDIR" && git sparse-checkout set packages/util-<name>
cp -r "$TMPDIR/packages/util-<name>" <your-project>/packages/util-<name>
rm -rf "$TMPDIR"
```

### After vendoring

```bash
cd packages/util-<name>
pnpm install
pnpm build
```

### Provenance file

```json
{
  "source": "<git-remote-url>",
  "package": "packages/util-<name>",
  "tag": "<git-tag-or-main>",
  "vendoredAt": "<ISO-8601 date>",
  "forked": false
}
```

### Updating

Re-run the sparse checkout commands with the new `PACKAGE_REF`, then update `.vendor.json`.

## Quick usage (vendored path)

(brief snippet — 5-10 lines max)

See [README.md](./README.md) for full API reference.

## Rules

- Do NOT modify vendored code. Extend via adapters or wrappers.
- If you must modify, update `.vendor.json` to mark `"forked": true`.
- Connection strings / secrets must come from environment variables.
````

---

## 6. Package README.md

The README must include:

1. Package name and one-line description
2. Install — `pnpm add @util/<name>` + any optional peer deps
3. Quick Start — minimal working example
4. Use Cases — when the package supports multiple flows (auth, logging, etc.), add a use-cases table mapping flows to helpers
5. How to Use — code examples for each major flow (register, login, refresh, etc.); keep in sync with API
6. Singleton usage (if applicable)
7. Full API table — every public method/property with signature and description
8. Config reference — table of config fields, types, defaults, descriptions
9. Sub-feature reference — if the package has sub-features (transports, adapters, strategies), document each one
10. Test Dockers — if tests require external services, list the `docker run` commands

**Sync rule:** When modifying a package, update README and SKILL together. Do not leave README stale after API or flow changes.

---

## 7. Checklist

| #   | Check                                                                                                                        | Done? |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | Folder structure matches section 1                                                                                           |       |
| 2   | Public class wraps underlying lib behind generic interface                                                                   |       |
| 3   | Private fields (`#field`) hide library internals                                                                             |       |
| 4   | `interfaces.ts` exists and defines package contracts/interfaces                                                              |       |
| 5   | `types.ts` has all types; no library types leak to consumers                                                                 |       |
| 6   | `constants.ts` has all magic values as `UPPER_SNAKE_CASE`                                                                    |       |
| 7   | `config.ts` normalizes typed config inputs (no dotenv in package code)                                                       |       |
| 8   | `index.ts` barrel exports only public API                                                                                    |       |
| 9   | Jest via root config; `test.env` optional for app/test bootstrap inputs                                                      |       |
| 10  | Tests cover: happy path, edge cases, singleton lifecycle, per-transport/feature, per-method, child/scoped (where applicable) |       |
| 11  | Tests are co-located, zero mocks, real execution                                                                             |       |
| 12  | `tsconfig.json` matches monorepo conventions                                                                                 |       |
| 13  | `package.json` has correct scripts, deps, engines                                                                            |       |
| 14  | `SKILL.md` with vendoring instructions at package root                                                                       |       |
| 15  | `README.md` with install, quick start, full API, config reference                                                            |       |
| 16  | code-review run once package is implementation-complete; `[high]`/`[med]` findings resolved                                  |       |
| 17  | All files follow js-code-style (including naming conventions helper)                                                         |       |
| 18  | All tests follow js-testing                                                                                                  |       |
