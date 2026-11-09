## Exports and Imports (helper for `js-code-style`)

### Consolidated Exports

Gather **all** exports into a single export block at the **end** of the file. Do not use inline `export` on individual declarations.

**Wrong:**

```typescript
export const PORT = 3000;

export const startServer = () => { ... };

export class AppServer { ... }
```

**Right:**

```typescript
const PORT = 3000;

const startServer = () => { ... };

class AppServer { ... }

export { PORT, startServer, AppServer };
```

For default exports, prefer a named export block. If a default is truly needed (for example, Next.js pages), place it at the bottom alongside the named exports:

```typescript
const HomePage = () => { ... };

export default HomePage;
```

### Separate Type Exports and Imports

Always use `export type` for type-only exports and `import type` for type-only imports. Never mix runtime values and types in the same import/export statement.

**Wrong:**

```typescript
import { UserService, UserProfile } from "./user.service";
//       ^ runtime       ^ type — mixed together

export { UserService, UserProfile };
```

**Right:**

```typescript
import { UserService } from "./user.service";
import type { UserProfile } from "./user.types";

export { UserService };
export type { UserProfile };
```

This enables proper tree-shaking and makes the boundary between runtime and compile-time artifacts explicit.

### Import Ordering

Imports must appear in the following strict order, separated by a blank line between each group:

1. **Type imports** (`import type { ... }`) — all type-only imports, regardless of source.
2. **Library imports** — third-party / `node_modules` packages.
3. **Local imports** — project-relative paths (starting with `./`, `../`, or `@/` aliases).

Within each group, prefer ordering by path proximity — sibling imports (`./`) first, then parent imports (`../`), then deeper ancestors.
