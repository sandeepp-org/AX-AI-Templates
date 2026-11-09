---
name: ddd-package-selector
description: "MANDATORY before writing any backend code. Routes every new feature: technical/reusable code → packages/util-* (build a package — no exceptions); business / product / domain logic → app/src/<module>/ DDD module. Triggers on add a feature, build X, create a service, add an endpoint, new module, refactor service, integrate third party. Enforces DDD + hexagonal layout (entities, ports, schemas, service, channels/http, infrastructure, shared) and forces a check for existing @util/* packages before creating new ones."
---

# DDD Package Selector: Build, Check, Create, Enforce

## Mandatory App Module Architecture (ALWAYS ENFORCE)

Every module inside `app/src/` **must** follow this exact folder structure. No exceptions.

```
app/src/
├── <module>/              # Bounded context (e.g. user, order)
│   ├── entities/          # Core types; no framework
│   ├── domain/            # Events, invariants, errors (optional)
│   ├── ports/             # Outbound interfaces (e.g. UserServicePort)
│   ├── schemas/           # Zod schemas for DB/API (optional)
│   ├── service/           # Application services, use cases
│   └── index.ts
├── channels/http/         # HTTP routes (user.routes.ts, order.routes.ts)
├── infrastructure/        # DB pool, HTTP clients, external SDKs, ObjectId helper
├── shared/                # Logger, secrets, shared utilities
└── index.ts
```

**Dependency rule:** `channels → service → entities, ports`; `service → infrastructure`. No framework imports in entities or ports.

| Need                | Add to               |
| ------------------- | -------------------- |
| New entity          | `<module>/entities/` |
| Domain event        | `<module>/domain/`   |
| Service port        | `<module>/ports/`    |
| Use case            | `<module>/service/`  |
| Zod schema (DB/API) | `<module>/schemas/`  |
| HTTP endpoint       | `channels/http/`     |
| DB / external       | `infrastructure/`    |
| Cross-module        | `shared/`            |

**Enforcement rules:**

- `helpers/` folders must NOT exist at the module root — internal helpers belong inside `service/`
- No `function` keyword, no framework imports (`express`, `mongoose`, etc.) in `entities/` or `ports/`
- Services import from `infrastructure/` only; never from `channels/`
- Every module must have an `index.ts` barrel that exports only its public API
- `shared/` is for cross-module utilities; never put domain logic there

---

**Use this skill when adding ANY new feature, service, or capability to the app.**

This is a **decision-driven workflow** that:

1. **Checks the repo** — does a reusable utility package already exist in `packages/`?
2. **Decides the target** — **technical / reusable** → package (`@util/*`); **business** → domain module (`app/src/<module>/`)?
3. **Enforces DDD + hexagonal** — validates folder structure, port/service/entity contracts, dependencies
4. **Creates the module** — scaffolds correctly from day one; prevents architectural rework

---

## Step 1: Decision — Technical Package vs Business App

**Default rule:**

| If the code is… | Put it in… |
| --------------- | ---------- |
| **Technical** — reusable **now** or plausibly **in the future** (another feature, service, or product), with **no** product-specific business rules or domain entities | **`packages/`** as `@util/*` |
| **Business** — product rules, workflows, domain language, entities tied to this app’s problem space | **`app/src/<module>/`** |

Ask:

```
┌──────────────────────────────────────────────────────────────┐
│ Is this technical code we can reuse (now or later),          │
│ without shipping domain entities / business rules?            │
└──────────────────────────────────────────────────────────────┘
         YES ↓                        NO ↓
    ┌─────────────┐            ┌─────────────────┐
    │ Package     │            │ App domain      │
    │ @util/*     │            │ module          │
    └─────────────┘            └─────────────────┘
         ↓                            ↓
    Check packages/              Check app/src/
    for existing @util/*        for existing <module>/
```

### Technical code → `packages/` (`@util/*`)

**Technical** means: libraries, adapters, algorithms, infra clients, formatting, validation primitives, etc. — **not** “what our business charges for an order” or “how our user lifecycle works.”

Examples already in this repo:

- **Logger** (`@util/logger`) — application-wide logging
- **Redis** (`@util/redis`) — session/cache store (no domain logic)
- **MongoDB wrapper** (`@util/mongodb`) — DB connection pool (no domain logic)
- **JWT tokens** (`@util/jwt-tokens`) — token minting and verification
- **Error normalizer** (`@util/error-normalizer`) — standardize error shapes
- **Rate limit core** (`@util/rate-limit-core`) — request throttling algorithm
- **Secret manager AWS** (`@util/secret-manager-aws`) — AWS Secrets Manager client
- **Agentic memory** (`@util/agentic-memory`) — agent trace storage
- **Agent trace** (`@util/agent-trace`) — OpenTelemetry tracing for agents

**Characteristics (all should hold for a package):**

- **No domain entities** (no User, Order, Invoice as business concepts — only generic types if needed)
- **Framework-agnostic** TypeScript where practical (adapters can target Express, etc., but core stays portable)
- **Reusable** across features or services — if it is one-off glue with no future reuse, keep it in **`app/`** (e.g. `shared/` or a module) instead of a new package
- **Defined by a technical problem** (logging, storage, crypto, parsing), not by a **business** problem (“our refund policy”)

### Business code → `app/src/<module>/` Domain Module

**Business** means: rules, workflows, and data that belong to **this product** and use **domain language** (customer, order, billing, agent run, etc.).

Examples:

- **User module** (`app/src/user/`) — user accounts, profiles, auth state
- **Order module** (`app/src/order/`) — orders, fulfillment, inventory
- **Agent module** (`app/src/agent/`) — agent lifecycle, scheduling, execution
- **Billing module** (`app/src/billing/`) — charges, invoices, subscriptions

**Characteristics:**

- Contains **domain entities** and **business rules**
- **Service** layer encodes use cases and policies
- **Ports** define outbound contracts; **channels/http** expose APIs
- **Depends on** `@util/*` packages for technical building blocks — business code **consumes** packages; it does not duplicate technical libraries inside `app/` unless the team explicitly defers extraction

Follow DDD + hexagonal layout in this skill for modules under `app/src/`.

---

## Step 2: Check for Existing Implementation

### If technical package (`@util/*`)

Search `packages/` for an existing `@util/*`:

```bash
# From repo root
find packages -name "package.json" -exec grep -l "\"name\": \"@util/<keyword>\"" {} \;
```

**If found:**

- Add to `app/package.json` dependencies
- Import and use; no new code needed
- Stop here

**If not found:**

- Proceed to Step 3: **Create utility package** (see **js-package-scaffold** skill)
- Create in `packages/util-<name>/`

### If business / domain module

Search `app/src/` for an existing module:

```bash
ls -la app/src/ | grep "^d" | awk '{print $NF}'
```

**If found:**

- Add the feature to the existing module's service and port
- Stay within the module's DDD boundaries

**If not found:**

- Proceed to Step 3: **Create domain module** (see DDD architecture rules below)
- Create in `app/src/<module>/`

---

## Step 3: Architecture & DDD + Hexagonal Rules

**Only for domain modules in `app/src/`**. Technical packages use **js-package-scaffold**.

### Folder Structure (Mandatory)

```
app/src/<module>/
├── entities/
│   └── <name>.entity.ts       # Core domain types; no framework, no infra
├── domain/
│   ├── events/                # (optional) Domain events
│   └── <name>.error.ts        # (optional) Domain invariants, errors
├── ports/
│   └── <name>-service.port.ts # Outbound interface; service implements this
├── schemas/
│   └── <name>.schema.ts       # Zod: DB doc shape or API input shape
├── service/
│   ├── <name>.service.ts      # Application service; implements port
│   └── <name>.service.test.ts # Integration tests with real DB
└── index.ts                   # Public export: entity, port, service
```

### Dependency Rules (No Exceptions)

```
HTTP Routes (channels/http/)
    ↓ (imports only entities, ports)
Service (app/src/<module>/service/)
    ↓ (imports only entities, ports, schemas, infra)
Entities + Ports (app/src/<module>/entities/ + ports/)
    ↓ (imports only types, no framework)
Infrastructure (app/src/infrastructure/)
    ↓ (imports external drivers, SDKs)
Utilities (packages/@util/*)
```

**Critical:** No framework imports (Express, MongoDB drivers) in entities, ports, or services. Framework stays in `channels/http/` and `infrastructure/`.

### Each File's Purpose

| File                           | Exports                             | Pattern           | Notes                                                    |
| ------------------------------ | ----------------------------------- | ----------------- | -------------------------------------------------------- |
| `entities/<name>.entity.ts`    | Plain TS types/interfaces           | None (pure data)  | No external imports; serializable                        |
| `ports/<name>-service.port.ts` | Interface; error types              | Interface pattern | Defines service contract; no implementation              |
| `service/<name>.service.ts`    | Class + static factory; error types | Singleton factory | `getInstance()`, `create(config)`, `close()` if stateful |
| `schemas/<name>.schema.ts`     | Zod objects                         | Schema builder    | For DB doc shape or API input validation                 |
| `index.ts`                     | Re-exports entity, port, service    | Barrel export     | Consumers import only from `src/<module>/`               |

### Sample: User Module

**entities/user.entity.ts**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
}
```

**ports/user-service.port.ts**

```typescript
export interface UserServicePort {
  getById(userId: string): Promise<User>;
  create(input: CreateUserInput): Promise<User>;
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`);
  }
}
```

**service/user.service.ts**

```typescript
export class UserService implements UserServicePort {
  private static instance: UserService;

  static create(db: MongoDBPort): UserService {
    // MongoDBPort comes from infrastructure/
  }

  async getById(userId: string): Promise<User> {
    // Business logic here; use this.#db (private field)
    // Return User entity, throw UserNotFoundError on failure
  }
}
```

**index.ts**

```typescript
export type { User } from "./entities/user.entity";
export { UserService, UserNotFoundError } from "./service/user.service";
export type { UserServicePort } from "./ports/user-service.port";
```

**channels/http/user.routes.ts**

```typescript
import { UserService, UserNotFoundError } from "../../user";

router.get("/:id", async (req, res) => {
  try {
    const user = await UserService.getInstance().getById(req.params.id);
    res.json(user);
  } catch (err: any) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
});
```

---

## Step 4: Enforcement Checklist

After planning, before opening PRs:

### Structure ✓

- [ ] Folder structure matches template exactly
- [ ] No framework imports in entities, ports, services
- [ ] `index.ts` correctly exports entity, port, service
- [ ] `interfaces.ts` (if utility package) or `port.ts` (domain module) defines boundary

### Dependencies ✓

- [ ] `package.json` lists only required deps (no bloated deps)
- [ ] Service depends only on port + infrastructure + utilities
- [ ] Routes import only from module's `index.ts` + infrastructure
- [ ] No circular imports (`grep -r "import.*service.*from.*routes"` should return nothing)

### Contracts ✓

- [ ] Port says what service must implement; service implements it exactly
- [ ] Entity types are serializable (no class instances in exported types)
- [ ] Errors are custom classes extending `Error`; thrown with context (userId, etc.)

### Testing ✓

- [ ] Happy path and error path covered per Test Plan
- [ ] No mocks; use real DB/Redis/external service (Docker)
- [ ] `test.env` or `.env.test` defines all required secrets
- [ ] Tests can run in isolation: `pnpm test <module>`

### Docs ✓

- [ ] `README.md` (if package) has Install, Quick Start, Exports, API table
- [ ] No unresolved high/medium code-review findings

---

## Module Scaffolding (Domain Module)

**Goal:** Structure is correct; all types are defined.

Run:

```bash
mkdir -p app/src/<module>/{entities,ports,schemas,service}
touch app/src/<module>/entities/<name>.entity.ts
touch app/src/<module>/ports/<name>-service.port.ts
touch app/src/<module>/schemas/<name>.schema.ts
touch app/src/<module>/service/<name>.service.ts
touch app/src/<module>/index.ts
```

Then implement entities, port, service, schemas, and HTTP route handlers; co-locate `*.test.ts` integration tests against real infrastructure (no mocks); update `app/README.md` if this is the first module of its kind.

---

## Anti-Patterns (Never Do This)

| Anti-Pattern                        | Why It's Wrong                                                          | Do This Instead                                       |
| ----------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Framework imports in service        | Service becomes Express-specific; can't test, reuse, integrate into CLI | Import only types; pass Express deps as parameters    |
| Service depends directly on MongoDB | Can't swap DB; can't unit test                                          | Inject infra via port/factory; use in-memory adapter  |
| No port; free-form service          | No contract; refactoring breaks callers silently                        | Define port first; service implements it              |
| Entity with methods (logic)         | Domain logic hidden in types; can't test                                | Entity = pure data; logic in service                  |
| Mixed entity + schema types         | Zod schema becomes public API; can't evolve DB without API break        | Entity for domain; schema for DB/API shape (separate) |
| Circular imports (routes ↔ service) | Build fails; types break; hard to debug                                 | Routes → Service → Port; one way only                 |

---

## When to Use This Skill

**Use this skill when:**

- Adding a new feature or domain module to the app
- Creating new **technical** code that belongs in `@util/*` (reusable now or later)
- Unsure whether code is **technical** (package) vs **business** (app) — use the decision tree
- Integrating a third-party service into the app
- Refactoring existing code into a proper module

**Do NOT use when:**

- Adding a simple helper function to an existing service (just edit the file)
- Debugging or fixing existing code (use code-review or coder agent)
- General coding questions (use coder agent)

---

## Example Prompts to Try This Skill

```
/ddd-package-selector
I need to add user profiles to the app. Users should have a bio, avatar, and notification preferences. Who needs this: end users via HTTP. Success: profiles load < 100ms, can be updated without re-auth.
```

```
/ddd-package-selector
We need a way to track agent executions: how long they ran, what tools they called, what errors happened. This is for debugging and monitoring. Who needs this: developers and ops. Success: < 1% performance overhead, traces stored for 30 days.
```

```
/ddd-package-selector
Should we create a payment processor module in the app, or a standalone @util/payments package?
```

---

## Related Skills & References

- **js-package-scaffold** — how to build utility packages; optional GOF tables in `helpers/design-patterns.md`
- **code-review** — enforce checklist after implementation
- **js-code-style** — code patterns, naming, structure rules


See `app/README.md` for DDD + hexagonal examples already in the codebase.
