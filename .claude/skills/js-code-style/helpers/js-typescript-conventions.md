## js-typescript-conventions (helper for `js-code-style`)

This document is part of the `js-code-style` skill. Edit both `.claude/skills/js-code-style/helpers/` and `.cursor/skills/js-code-style/helpers/`.

---

# TypeScript Conventions

These rules apply to all JavaScript/TypeScript codebases. For function style, exports, imports, and naming, follow **js-code-style** and its helpers (including `js-naming-conventions.md`).

## Interface vs Type

- **Interface**: for object shapes that may be extended.
- **Type**: for unions, intersections, mapped types, and type aliases.
- **Package boundary rule**:
  - `src/interfaces.ts` contains only public abstract contracts consumed outside the module/package.
  - `src/types.ts` contains internal implementation shapes, DTO/config shapes, adapter/client typings, and aliases not required as public contracts.

```typescript
export interface AppConfig {
  port?: number;
  envPath?: string;
}

export type RouteHandler = RequestHandler | RequestHandler[];
export type HelmetConfig = Parameters<typeof helmetLib>[0];
```

## Null Checks

With `noUncheckedIndexedAccess` or strict null checks:

```typescript
const items: string[] = [];

// Wrong: possibly undefined
const first = items[0].toUpperCase();

// Correct: handle undefined
const first = items[0]?.toUpperCase() ?? "default";

// Or assert when sure
const first = items[0]!.toUpperCase();
```

## Error Handling

Use custom error classes for domain errors; map in channels to HTTP status.

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

if (!user) {
  throw new AppError("User not found", 404, "USER_NOT_FOUND");
}
```

## Generic Patterns

Use arrow functions for factories (per js-code-style):

```typescript
const createHandler = <T>(config: T): RequestHandler => {
  return (req, res) => {
    res.json(config);
  };
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

## Comments

One-liner comments for exports and non-obvious code:

```typescript
// Creates Express app with health check and graceful shutdown
const createApp = (config: AppConfig = {}): App => { ... };

// Sanitize middleware — removes XSS attack vectors from user input
const sanitizeMiddleware = (config: SanitizeConfig = {}): RequestHandler => { ... };
```

## Strict Mode Compliance

With `strict: true` in tsconfig:

- No implicit any
- No implicit this
- Strict null checks
- Strict function types
- Strict property initialization
