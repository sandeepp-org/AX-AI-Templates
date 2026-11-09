## js-build-standards (helper for `js-code-style`)

This document is part of the `js-code-style` skill. Edit both `.claude/skills/js-code-style/helpers/` and `.cursor/skills/js-code-style/helpers/`.

---

# Build Standards

Follow these standards for all new code in this monorepo.

## Architecture

### Hexagonal (Ports & Adapters)

- **Domain** — entities, ports (interfaces). No external deps.
- **Service** — business logic. Depends only on ports.
- **Adapters (driven)** — implement ports (e.g. `InMemoryUserRepository`).
- **Channels** — entry points. HTTP: `channels/http/`. Framework-specific (Express).
- **Framework-agnostic** — service, adapters, entities, ports use plain TypeScript. Only `channels/http/` imports Express.

### Module Layout (Apps)

```
<module>/
├── entities/
├── ports/
├── adapters/
├── service/
├── channels/http/
├── schemas/
└── index.ts
```

### Flow

```
Request → channels/http → service → ports ← adapters
```

---

## Main = Class, Helpers = Functional

- **Main logic**: Use classes. Choose singleton or multi-instance per requirement.
- **Helpers**: Use **functional** code — pure functions in `helpers/*.util.ts`. No static util classes.

| Layer   | Class                     | Example                                    |
| ------- | ------------------------- | ------------------------------------------ |
| Service | `ThingService`            | `UserService`                              |
| Routes  | `ThingRoutes`             | `UserRoutes` with `register(router)`       |
| Adapter | `InMemoryThingRepository` | `InMemoryUserRepository`                   |
| Factory | `ThingFactory`            | `LoggerFactory`, `SecretsManagerFactory`   |
| Helpers | Pure functions (arrow)    | `buildTarget.util.ts`, `serialize.util.ts` |

---

## SOLID

- **S** — Single responsibility. One class, one concern.
- **O** — Open/closed. Extend via new adapters, not modifying core.
- **L** — Liskov. Adapters implement ports correctly; subtypes substitutable.
- **I** — Interface segregation. Small, focused ports (e.g. `UserRepository`).
- **D** — Dependency inversion. Service depends on `UserRepository` (port), not `InMemoryUserRepository`. Inject via constructor.

---

## Design Patterns

| Pattern          | Use                     | Example                                                                                          |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Repository**   | Abstract persistence    | `UserRepository` port, `InMemoryUserRepository` adapter                                          |
| **Factory**      | Create instances        | `LoggerFactory.getLogger()` (app-level). Packages: Manager wraps provider, no package singleton. |
| **Lazy loading** | Defer heavy imports     | `bootstrap()` dynamic import, `getSecrets()` on first access. Logger: getLogger() at app level.  |
| **Adapter**      | Bridge external systems | `channels/http` adapts Express → service calls                                                   |

**Pluggable provider packages** (logger, secrets-manager):

- Config types colocated with provider, not in central types
- Shared utils for duplicated logic (no copy-paste across providers)
- No package-level singleton — apps create instance; Manager wraps provider
- Optional peer deps: define types in provider file, not shared interfaces
- **interfaces.ts not types.ts**: When the file primarily defines the core interface (Logger, SecretsProvider), use `interfaces.ts`. Avoid `types.ts` for interface-only files.

---

## Naming Conventions

| Type      | Convention                                    | Example                                                                               |
| --------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Package   | `@util/<name>`                                | `@util/logger`                                                                        |
| Class     | `PascalCase`                                  | `UserService`                                                                         |
| File      | `kebab-case.ts` or `thing.routes.ts`          | `user-repository.port.ts`, `user.routes.ts`                                           |
| Test      | `[name].test.ts`                              | `user.service.test.ts`                                                                |
| Port file | `thing.port.ts` or `thing-repository.port.ts` | `user-repository.port.ts`                                                             |
| Entity    | `PascalCase` interface                        | `User`                                                                                |
| Variables | Descriptive, no abbreviations                 | See `js-code-style/helpers/js-naming-conventions.md` for avoid-abbreviations guidance |

---

## Tests

- **Placement**: `[name].test.ts` alongside source.
- **Framework**: Jest.
- **Structure**: `describe` blocks, `it` cases, `beforeAll`/`beforeEach`/`afterEach` as needed.
- **HTTP tests**: Use Supertest. Import `app` and call `await bootstrap()` in `beforeAll` before requests.
- **Strategy**: Follow **js-testing** skill — zero mocking, real execution. No mocks, stubs, or spies.

---

## README Format (Packages)

**Mandatory:** All package documentation goes in `README.md`.

Use this structure for every package:

- **How it fits in** — Brief note on where the package sits (e.g. "Pluggable logger used by apps and express-api requestLogger").
- **Usage examples** — Clear, copy-pasteable examples for common flows.
- **Module-level docs** — In complex packages, add short JSDoc or top-of-file comments explaining the module's role.

```markdown
# @util/<name>

[One-line description. How it fits in the system.]

## Install

\`\`\`bash
pnpm add @util/<name>
\`\`\`

## Quick Start

[Minimal working example]

## [Main Concepts]

[API reference, options, usage]

## Exports

| Export | Description |

## Package Structure

\`\`\`
packages/util-<name>/
├── src/ (helpers/, sub-features/, constants, config, types, main class, index)
├── test.env
├── tsconfig.json
├── package.json
├── SKILL.md
└── README.md
\`\`\`

## Scripts

\`\`\`bash
pnpm build
pnpm test
pnpm lint
\`\`\`
```

---

## Package Handling (Monorepo)

### Dependency Direction

- **Packages** → may depend on other packages (e.g. swagger depends on express-api)
- **Apps** → depend on packages via `workspace:*`
- **Never**: packages must not depend on apps; apps must not depend on other apps

### When to Create a Package vs Keep in App

| Create Package                                      | Keep in App                         |
| --------------------------------------------------- | ----------------------------------- |
| Reusable across multiple apps                       | Single-app feature logic            |
| Shared infra (logger, secrets, swagger)             | Domain entities specific to one API |
| Framework utilities (express-api, schema-validator) | HTTP route wiring                   |
| Pure utilities with no app coupling                 | Module-specific adapters            |

### Package Types

| Type          | Example                         | Notes                                   |
| ------------- | ------------------------------- | --------------------------------------- |
| **Library**   | `@util/logger`, `@util/swagger` | Exports classes/functions, used by apps |
| **Utility**   | `@util/schema-validator`        | Stateless helpers                       |
| **Framework** | `@util/express-api`             | App bootstrap, middleware               |

### Adding a Package

1. Create `packages/util-<name>/` (or copy from an existing package)
2. `package.json`: `"name": "@util/<name>"`, `"type": "module"`, `"main"`/`"types"`/`"exports"`
3. Add to root `tsconfig.json` references: `{ "path": "packages/util-<name>" }`
4. Add to `pnpm-workspace.yaml` (already covers `packages/*`)
5. Run `pnpm install`
6. Implement class-based, with tests, README
7. Run `pnpm build && pnpm test`

### package.json Conventions (Packages)

- Use `workspace:*` for internal package deps (e.g. `"@util/express-api": "workspace:*"`)
- `exports` for subpaths (e.g. `"./providers/console"`) when consumers need fine-grained imports
- `peerDependencies` for optional integrations (e.g. mongodb for MongoLogger)
- `files: ["dist"]` — only publish built output
- `private: true` for app packages; omit for publishable packages

### Adding/Updating Dependencies

- **App**: `pnpm add <pkg> --filter app`
- **Package**: `pnpm add <pkg> --filter @util/<package>`
- **Use latest version** when adding packages: `pnpm add <pkg>@latest` or `pnpm add <pkg>` (defaults to latest). Avoid pinning to older versions unless compatibility requires it.
- Avoid circular deps: if A → B and B needs A, extract shared types into a third package

### Barrel Exports (Packages)

- Use `src/index.ts` to re-export public API. Do not export internals.
- Subpath exports (e.g. `@util/logger/providers/console`) for heavy or optional modules.
- Keep default export minimal; prefer named exports.

### Turborepo Pipeline

- `build` depends on `^build` (build deps first)
- `test` depends on `^build`
- Outputs: `dist/**` for caching
- Run from root: `pnpm build`, `pnpm test`, `pnpm lint`

---

## Error Handling & Resilience

- **Domain errors**: Throw typed errors (e.g. `NotFoundError`, `ValidationError`); map in channels to HTTP status
- **Port failures**: Adapters catch external errors, rethrow or wrap; service stays agnostic
- **Secrets/env**: Never commit secrets; use `getSecrets()` or `process.env`; fail fast if required vars missing
- **Logging**: Inject logger into services; log at boundaries (request start/end, errors)

---

## Adding a Module (App)

1. Create `src/<module>/` with entities, ports, service, index.ts; `src/channels/http/<module>.routes.ts` for routes
2. Classes: `ThingService`, `ThingRoutes`, `InThingRepository` adapter
3. Export `registerThingRoutes` from index.ts
4. Add to `bootstrap()`: `const { registerThingRoutes } = await import("./<module>/index.js");` and routes array
5. Add tests with `beforeAll(() => bootstrap())`

---

**Precedence**: When js-\* skills overlap, follow `js-code-style` (including its helpers) and `js-testing`.

## Checklist Before PR

- [ ] Main logic class-based; helpers functional
- [ ] SOLID respected
- [ ] Hexagonal boundaries (channels = framework, rest = agnostic)
- [ ] Tests present and passing
- [ ] README updated (packages)
- [ ] Naming follows conventions (`@util/` prefix, kebab-case files)
- [ ] Lazy loading where appropriate (heavy deps, optional features)
- [ ] No circular dependencies (packages ↔ packages)
- [ ] Dependencies added via `pnpm add --filter @util/<target>`
