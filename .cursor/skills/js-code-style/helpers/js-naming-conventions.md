## js-naming-conventions (helper for `js-code-style`)

This document is part of the `js-code-style` skill. Edit both `.claude/skills/js-code-style/helpers/` and `.cursor/skills/js-code-style/helpers/`.

---

# Naming Conventions for JavaScript / TypeScript Projects

These conventions apply to all MEAN, MERN, and full-stack JavaScript/TypeScript codebases.

## Files

- **Always kebab-case** — lowercase letters separated by hyphens.
- Include a descriptive suffix that reflects the file's role.

| File role        | Pattern                                | Example                      |
| ---------------- | -------------------------------------- | ---------------------------- |
| Component        | `<name>.component.tsx`                 | `user-profile.component.tsx` |
| Service          | `<name>.service.ts`                    | `auth.service.ts`            |
| Controller       | `<name>.controller.ts`                 | `order.controller.ts`        |
| Model / Schema   | `<name>.model.ts`                      | `product.model.ts`           |
| Route            | `<name>.routes.ts`                     | `payment.routes.ts`          |
| Middleware       | `<name>.middleware.ts`                 | `rate-limiter.middleware.ts` |
| Utility / Helper | `<name>.util.ts` or `<name>.helper.ts` | `string.util.ts`             |
| Hook (React)     | `use-<name>.ts`                        | `use-auth.ts`                |
| Test             | `<name>.test.ts` or `<name>.spec.ts`   | `auth.service.test.ts`       |
| Type definitions | `<name>.types.ts`                      | `user.types.ts`              |
| Constants        | `<name>.constants.ts`                  | `api.constants.ts`           |
| Config           | `<name>.config.ts`                     | `database.config.ts`         |
| Index / barrel   | `index.ts`                             | `index.ts`                   |

**Wrong:**

```
UserProfile.tsx
authService.ts
Rate_Limiter.middleware.ts
```

**Right:**

```
user-profile.component.tsx
auth.service.ts
rate-limiter.middleware.ts
```

## Folders

- **Always kebab-case** — lowercase letters separated by hyphens.
- Use plural names for collections, singular for single-purpose directories.

**Wrong:**

```
UserComponents/
sharedUtils/
API_Routes/
```

**Right:**

```
user-components/
shared-utils/
api-routes/
```

## Classes

- **PascalCase** — each word capitalised, no separators.

```typescript
class UserProfile {}
class OrderService {}
class PaymentGateway {}
```

## Interfaces and Type Aliases

- **PascalCase** — same convention as classes.
- Do **not** prefix interfaces with `I`.

```typescript
type UserProfile = { ... };
interface OrderPayload { ... };
```

## Variables and Constants

- **camelCase** for regular variables.

```typescript
const userName = "alice";
let orderCount = 0;
```

- **Avoid abbreviations** — use descriptive names for variables and private fields:

| Avoid           | Prefer                            |
| --------------- | --------------------------------- |
| `ee`            | `eventEmitter`                    |
| `em`            | `emitter`                         |
| `msg`           | `message`                         |
| `h1`, `h2`      | `handler1`, `handler2`            |
| `fn` (in loops) | `listener`, `callback`, `handler` |
| `ev`            | `event`                           |
| `cfg`, `conf`   | `config`                          |
| `cb`            | `callback`                        |

**Exceptions** (standard conventions, keep as-is): `req`, `res`, `next` (Express handlers); `err` (catch block); `id` when clearly an identifier (e.g. `clientId`).

- **UPPER_SNAKE_CASE** for true compile-time or environment constants.

```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = process.env.API_BASE_URL;
```

## Functions and Methods

- **camelCase** — verb-first naming that describes the action.

```typescript
const getUserById = (id: string) => { ... };
const calculateTotal = (items: CartItem[]) => { ... };
const handleSubmit = (event: FormEvent) => { ... };
```

## React Components

- **PascalCase** for component names (matching the class convention).
- The file name is still kebab-case (`user-profile.component.tsx`), but the exported component is PascalCase.

```typescript
const UserProfile = () => { ... };
const OrderSummary = ({ items }: OrderSummaryProps) => { ... };
```

## Enums

- **PascalCase** for the enum name.
- **PascalCase** for enum members.

```typescript
enum OrderStatus {
  Pending,
  Shipped,
  Delivered,
  Cancelled,
}
```

## Environment Variables

- **UPPER_SNAKE_CASE**, prefixed by context when useful.

```
DATABASE_URL=...
JWT_SECRET=...
REDIS_HOST=...
```

## Package Names

- **kebab-case** for npm package names — lowercase letters separated by hyphens.

```
cau-logger
cau-api-server
cau-mongodb
custom-agent-utils
```

## Boolean Variables

- **camelCase** with a prefix that signals the type:
  - `is` — state or identity: `isPretty`, `isEnabled`, `isLoading`
  - `has` — presence: `hasDirnameMongo`, `hasDistMongo`, `hasError`
  - `should` — intent: `shouldRetry`, `shouldValidate`
  - `can` — capability: `canEdit`, `canSubmit`
  - `use` — derived decision: `useDist`, `useCache`

```typescript
const isPretty = config.format === LogFormat.PRETTY;
const hasMongo = existsSync(join(dir, MONGO_TRANSPORT_FILE));
const useDist = !hasDirnameMongo && hasDistMongo;
```

## Type and Interface Suffixes

Use consistent suffixes for common shapes:

| Suffix       | Purpose                        | Example                              |
| ------------ | ------------------------------ | ------------------------------------ |
| `Config`     | Configuration object           | `ServerConfig`, `LoggerConfig`       |
| `Options`    | Optional settings              | `SecurityOptions`, `BuildOptions`    |
| `Context`    | Request/scope context          | `RouteContext`, `HandlerContext`     |
| `Definition` | Declarative structure          | `RouteDefinition`, `TransportConfig` |
| `Handler`    | Callback or async handler      | `RouteHandler`, `LifecycleCallback`  |
| `Deps`       | Dependency injection container | `SignalHandlerDeps`                  |

```typescript
type ApiServerConfig = { routes: RouteDefinition[]; config?: ServerConfig };
type RouteContext = { logger: Logger; requestId: string };
```

## Private Class Fields

- **camelCase** prefixed with `#` — private class fields (ECMAScript private).

```typescript
class Logger {
  static #instance: Logger | null = null;
  #underlyingLib: PinoLogger;

  private constructor(lib: PinoLogger) {
    this.#underlyingLib = lib;
  }
}
```

## Factory and Creator Functions

- **camelCase** with `create` prefix when returning a new instance or complex object.

```typescript
const createRequestIdMiddleware = (logger: Logger) => { ... };
const createApiServer = (config: ApiServerConfig) => { ... };
```

## Test Block Naming

- **describe** — function/class name or module name: `describe("buildTarget", ...)` or `describe("buildTargets", ...)`.
- **it** — `"should <expected behavior>"` — describe the outcome, not the setup.

```typescript
describe("buildTarget", () => {
  describe("console transport", () => {
    it("should build a pino-pretty target when format is pretty", () => { ... });
    it("should use stderr when destination is stderr", () => { ... });
  });
});
```

## Generic Type Parameters

- **Single generic** — `T` when the meaning is obvious: `ApiResponse<T>`.
- **Multiple generics** — descriptive names: `TKey`, `TValue`, `TInput`, `TOutput` when clarity matters.

```typescript
type ApiResponse<T = unknown> = { data: T | null; error: string | null };
type MapLike<K, V> = { get(key: K): V | undefined };
```

## Quick Reference Table

| Identifier        | Convention                    | Example                                 |
| ----------------- | ----------------------------- | --------------------------------------- |
| File              | kebab-case                    | `user-profile.component.tsx`            |
| Folder            | kebab-case                    | `shared-utils/`                         |
| Package name      | kebab-case                    | `cau-logger`, `cau-api-server`          |
| Class             | PascalCase                    | `UserProfile`                           |
| Interface / Type  | PascalCase (no `I` prefix)    | `OrderPayload`, `ServerConfig`          |
| Private field     | #camelCase                    | `#underlyingLib`                        |
| Variable          | camelCase                     | `orderCount`                            |
| Boolean variable  | camelCase (is/has/should/can) | `isPretty`, `hasMongo`                  |
| Constant          | UPPER_SNAKE_CASE              | `MAX_RETRY_COUNT`                       |
| Function / Method | camelCase, verb-first         | `getUserById`, `createApiServer`        |
| React Component   | PascalCase                    | `UserProfile`                           |
| Enum              | PascalCase                    | `OrderStatus`                           |
| Enum Member       | PascalCase                    | `Shipped`                               |
| Env Variable      | UPPER_SNAKE_CASE              | `DATABASE_URL`                          |
| describe block    | function/class name           | `"buildTarget"`                         |
| it block          | "should <expected behavior>"  | `"should return user when id is valid"` |
