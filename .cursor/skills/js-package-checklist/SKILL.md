---
name: js-package-checklist
description: "MANDATORY when creating, validating, or modifying any package under packages/. Enforces @util/<name> naming (kebab-case), folder structure, package.json scripts (build/test/typecheck/clean), exports map, README sections, SKILL.md, public-API class with functional helpers, SOLID + adapter/factory patterns, and a pre-PR checklist. Use alongside js-package-scaffold for new packages and standalone for audits."
---

# Package Checklist

Follow this checklist when creating or validating packages in this monorepo. For project-wide chores (deps, rules/docs sync, git), see **project-context-sync** skill.

> **Style, naming, and testing rules are not repeated here.** When generating or reviewing any file, load **js-code-style** (including naming helpers) and **js-testing** directly.

## Org Prefix

- **Default**: `@util/` (check root `package.json` for the org scope)
- **Override**: Check root `package.json` or explicit user instruction to infer org
- **Rule**: All packages use `@<org>/<package-name>` in `kebab-case`

## Package Naming

| Convention             | Example                                           | Avoid                                                               |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Single-word utilities  | `@util/utils`, `@util/logger`                     | camelCase (`schemaValidator`)                                       |
| Hyphenated descriptive | `@util/schema-validator`, `@util/secrets-manager` | No prefix (`logger`), combined concerns (`utils-schema-validation`) |

**Naming follows responsibility**: `utils` = generic helpers; `schema-validator` = validation only; `secrets-manager` = secrets abstraction. Split into separate packages; do not conflate.

## SOLID & Design Patterns (Package Context)

| Principle / Pattern       | Applied to Packages                     | Example                                                               |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Single Responsibility** | One package, one concern                | `@util/utils` vs `@util/schema-validator` — do not combine            |
| **Interface Segregation** | Keep exports small and focused          | Subpaths: `@util/logger/providers/console` for heavy/optional modules |
| **Dependency Inversion**  | Packages depend on abstractions (ports) | Core + Express adapter; core stays framework-agnostic                 |
| **Adapter**               | Framework integrations as submodules    | `schema-validator` core + `express` adapter; `logger` providers       |
| **Factory**               | Export factory when wiring is complex   | `LoggerFactory`, `SecretsManagerFactory`                              |

For full GOF reference (optional), see **js-package-scaffold** → `helpers/design-patterns.md`.

## Mandatory Package Structure

Use `packages/util-<name>/` as the directory (util- prefix + package name). See **js-package-scaffold** for the full canonical layout.

```
packages/util-<name>/
├── src/
│   ├── helpers/
│   ├── <sub-feature>/    # optional
│   ├── interfaces.ts
│   ├── constants.ts
│   ├── config.ts
│   ├── types.ts
│   ├── <main-class>.ts
│   ├── <main-class>.test.ts
│   └── index.ts
├── test.env
├── tsconfig.json
├── package.json
├── SKILL.md
└── README.md
```

## Common Build Rule: README

**Every package and every app** must have:

- **README.md** — usage, API, how it fits

**Sync rule:** When modifying a package, update README and SKILL together. Add use cases, how-to examples, and API changes to README; update SKILL if usage or vendoring guidance changes.

## README (Critical — Mandatory)

All package documentation goes in `README.md`. Every package must have a README with these sections:

| Section              | Required                         | Content                                                                                    |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| Title                | Yes                              | `# @<org>/<name>`                                                                          |
| One-line summary     | Yes                              | Below title (engine, purpose)                                                              |
| Install              | Yes                              | `pnpm add @util/<name>` + peer deps                                                        |
| Quick Start          | Yes                              | Minimal working example                                                                    |
| Infrastructure setup | If package uses external service | How to run/provision infra (Docker, cloud service), required env vars, secret wiring       |
| Singleton            | If applicable                    | Use when shared state/resource justifies it; otherwise use instance/static pattern         |
| Multi-Transport      | If applicable                    | Per-transport config, levels                                                               |
| Child Loggers        | If applicable                    | `child(bindings)` usage                                                                    |
| Graceful Shutdown    | If applicable                    | `close()` on SIGTERM                                                                       |
| API                  | Yes                              | Method table, config table                                                                 |
| Transport Reference  | If applicable                    | Per-transport options, schema                                                              |
| Log Levels           | If applicable                    | Level table                                                                                |
| Package Structure    | Yes                              | Directory tree                                                                             |
| Scripts              | Yes                              | `pnpm build`, `pnpm test`, `pnpm lint`                                                     |
| Test Dockers         | If applicable                    | Docker commands for integration tests (DBs, queues, caches, AWS emulators like LocalStack) |

## package.json & tsconfig.json

- **package.json**: `name`, `version`, `type: "module"`, `main`, `types`, `files: ["dist"]`, `exports`, scripts
- **tsconfig.json**: Extends base, `rootDir`, `outDir`, `composite`, include/exclude

### package.json Template

```json
{
  "name": "@util/[name]",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc --build",
    "test": "jest --config ../../jest.config.cjs --testPathPatterns=\"packages/util-[name]\"",
    "test:watch": "jest --config ../../jest.config.cjs --testPathPatterns=\"packages/util-[name]\" --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^25.0.0",
    "typescript": "^5.9.0",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.0"
  }
}
```

### tsconfig.json Template

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

### src/index.ts Template

```typescript
const hello = (): string => {
  return "Hello from @util/[name]";
};

export { hello };
```

### src/index.test.ts Template

```typescript
import { hello } from "./index.js";

describe("[name]", () => {
  it("should return greeting", () => {
    expect(hello()).toBe("Hello from @util/[name]");
  });
});
```

### Steps to Create

1. Scaffold files per the structure above (interfaces, types, config, constants, main class, helpers, index, co-located tests)
2. Implement main class + helpers
3. Implement tests covering happy path, edge cases, lifecycle, per-method coverage
4. Write README and SKILL.md
5. Add to root `tsconfig.json`: `{ "path": "packages/util-[name]" }`
6. Run `pnpm install && pnpm build && pnpm test`
7. Run `code-review` and fix `[high]`/`[med]` findings before opening a PR

- **Dependencies**: Use `workspace:*` for internal; `pnpm add <pkg>@latest` for external.

## Pre-PR Checklist

- [ ] `code-review` run; all `[high]` and `[med]` findings resolved
- [ ] Package name: `@util/<name>` in `kebab-case`
- [ ] `package.json` has correct name, prefix, and exports
- [ ] Directory structure matches template
- [ ] `src/interfaces.ts` exists and defines package boundary contracts
- [ ] **README** — Install, Quick Start, Exports, Package Structure, Scripts all present
- [ ] **README (infra packages)** — If the package depends on external infra (DB, Redis, queues, AWS, etc.), it includes an **Infrastructure setup** section with:
  - local dev instructions (Docker or emulator)
  - production / cloud notes at a high level
  - required env vars and how to wire secrets (for example via `@util/secret-manager-aws`)
- [ ] Tests cover: happy path, edge cases, singleton lifecycle, per-transport/feature, per-method, child/scoped (where applicable)
- [ ] Tests in `*.test.ts` alongside source — zero mocks, real execution
- [ ] Root `tsconfig.json` includes package reference
- [ ] `pnpm install` run; no circular deps

## When to Use This Checklist (MANDATORY)

This checklist MUST be applied when:

- Creating a new package
- Modifying package structure
- Adding new features to a package
- Before raising PR

Do NOT skip this checklist.
