---
name: frontend-architecture
description: Comprehensive frontend architecture guide for component design, state management, theming, packages, mobile-first approach, and code reusability. Enforces separation of business logic from UI, custom hooks for DRY code, pixel-perfect design, and organized folder structure across the Canopy design system.
---

# Frontend Architecture Skill

Use this skill when writing any React/TypeScript code in `front-end/app/` or creating components/utilities in `front-end/packages/`. Enforces structural patterns, state management discipline, and code reuse strategies.

## Hard Rules (Non-Negotiable)

1. **Business logic ≠ UI components**  
   - Extract all domain/business logic into custom hooks (`hooks/use*.ts`) or utility functions (`utils/`)
   - Components are presentational shells; they receive computed data from hooks
   - Example: `useUserAuth()` handles auth state → component renders result; no async/API calls directly in JSX

2. **Mobile-first, pixel-perfect design**  
   - All breakpoints start from mobile (xs/sm) → scale up to desktop (lg/xl/2xl)
   - Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` only (never hardcode dimensions)
   - Test on real mobile device or viewport ≤375px before marking complete
   - Pixel-perfect means: exact spacing (use Tailwind's spacing scale), alignment, font sizes, line heights from Figma

3. **Theme via `@canopy/chroma`**  
   - Import theme tokens, colors, and config from `@canopy/chroma` only (never hardcode `#fff`, colors)
   - Define custom theme in `tailwind.config.ts` by extending chroma's base config
   - Use CSS variables for dynamic theming (dark/light mode, custom branding)
   - All color usage: `text-primary`, `bg-surface`, `border-divider` (semantic tokens, not raw Tailwind)

4. **Package structure for reusability** (`front-end/packages/`)
   - **`chroma/`**: Theme, design tokens, colors, typography → shared globally
   - **`frontend-utils/`**: HTTP clients (REST/gRPC), API helpers → no UI, no React
   - **`shadcn-core/`**: Base button, card, input (unstyled/minimal) → reusable atoms
   - **`shadcn-modulus/`**: Feature modules (auth flow, data table, form) → composed from shadcn-core
   - **New package rule**: If >3 pages share same components OR logic, extract to `front-end/packages/@canopy/feature-*`
   - Every package must have: `src/`, `package.json`, `README.md`, `tsconfig.json`, exports map in package.json

5. **Folder structure in app** (`front-end/app/src/`)
   ```
   src/
     app/               ← Route pages (next.js/router structure)
       layout.tsx       ← Root layout
       page.tsx         ← Home page
       auth/
         page.tsx       ← /auth
         login/
           page.tsx     ← /auth/login
     components/
       common/          ← Reused across many pages (Header, Footer, Nav, Sidebar)
       features/        ← Feature-specific (only used in one flow, e.g., CheckoutFlow)
     hooks/             ← Custom hooks (useAuth, useFetch, usePagination, etc.)
     context/           ← React Context for global state (auth, theme, user prefs)
     utils/             ← Pure functions, helpers (format, validate, parse, compute)
     types/             ← TypeScript interfaces, types (separate from component files)
     styles/            ← Global styles, tailwind config (if not in root)
   ```

6. **Component segregation** (Atomic + Feature layers)
   - **Atoms** (shadcn-core): Button, Input, Label, Badge, etc. — single purpose, no state, reusable
   - **Molecules**: Card + Badge (combines atoms), Form field + Input (atoms) — simple interactions
   - **Organisms**: Login form (multiple molecules), Data table (state + pagination) — complex interactions
   - **Templates**: Page layout (header + sidebar + content) — structure
   - **Features**: Complete user flows (auth, checkout, dashboard) — business logic + organisms
   - **Rule**: No organism inside component file; always compose at page/feature level

7. **State management layering**
   - **Local**: `useState` for UI-only (modal open/close, form input, tab selection) → component level
   - **Context**: Shared across many pages (auth user, theme, language) → use `app/context/`
   - **Custom hooks**: Complex logic + state (fetch, pagination, filters) → `hooks/use*.ts`
   - **Never**: Prop-drill >3 levels; use Context or custom hook instead
   - **Zod + React Hook Form**: Forms with validation → `hooks/useForm()` wrapper

8. **Code reuse (DRY, zero duplication)**
   - **Custom hooks**: Shared stateful logic → `useDataFetch(url)`, `useLocalStorage(key)`, `usePagination(items)`, `useDebounce(value)`
   - **Utility functions**: Pure logic → `formatDate()`, `validateEmail()`, `parseJSON()`
   - **Compound components**: Avoid repeat JSX → `<CardContainer><CardTitle/><CardBody/></CardContainer>` (one definition, reuse structure)
   - **Template literals**: Dynamic classnames → `cn()` helper (use clsx or classnames, not string concatenation)
   - If duplicating code >twice, extract immediately

9. **Styling discipline**
   - **No inline styles** (`style={{}}`) — always use Tailwind classes
   - **No CSS-in-JS or css modules** unless exteme case (animation libs) — Tailwind + utility functions
   - **Responsive images**: Use `<img srcSet />` or `<picture>` with mobile-first art direction
   - **Dark mode**: Define in `tailwind.config.ts` with `darkMode: 'class'`, apply `dark:` prefix to all color classes
   - **Animations**: Use Tailwind animation utilities or Framer Motion with Tailwind classes; avoid raw CSS keyframes

10. **Accessibility + Performance**
    - **A11y**: Labels for inputs, ARIA roles for complex widgets, semantic HTML (button not div)
    - **Images**: Always `alt` text; use WebP with fallback; lazy load below fold
    - **Performance**: Lazy load routes with `React.lazy()`, memoize with `React.memo()` for expensive renders, avoid re-renders with `useCallback`
    - **Bundle**: Use dynamic imports for feature packages; track with build analyzer

---

## Folder Structure & File Conventions

### `front-end/app/src/components/`

```
components/
  common/
    Header.tsx         ← Used in 3+ pages
    Footer.tsx
    Navigation.tsx
  features/
    CheckoutFlow/
      CheckoutFlow.tsx
      OrderSummary.tsx
      PaymentForm.tsx
    AuthFlow/
      LoginForm.tsx
      SignupForm.tsx
```

**Naming**:
- Components: PascalCase (`Button.tsx`, `UserCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`, `useFetchUsers.ts`)
- Utils: camelCase (`formatDate.ts`, `apiClient.ts`)
- Context: `*Context.ts` or `*Provider.tsx`

### `front-end/app/src/hooks/`

```
hooks/
  useAuth.ts           ← Manages auth state, login/logout
  useFetch.ts          ← Generic data fetching + error/loading
  usePagination.ts     ← Pagination logic (page, pageSize, nextPage, etc.)
  useLocalStorage.ts   ← Sync component state with localStorage
  useDebounce.ts       ← Debounce hook for search input
  useForm.ts           ← React Hook Form wrapper with Zod validation
```

All hooks must:
- Extract business logic from components
- Be pure (same inputs = same outputs)
- Return simple data + functions, not JSX
- Have TypeScript types for return value

### `front-end/packages/@canopy/*`

**When to create a new package**:
- Component used across 3+ feature modules OR 3+ apps
- Utility library (API client, logger, validator) needed by multiple features
- Complex state management (form builder, data table) used in many places

**Package structure** (e.g., `@canopy/shadcn-modulus`):

```
shadcn-modulus/
  package.json         ← exports: { ".": "./dist/index.js", "./components": "./dist/components/index.js" }
  tsconfig.json
  README.md            ← Usage examples, props, variants
  SKILL.md             ← Specific rules for this package (if any)
  src/
    index.ts           ← Re-export main public API
    components/
      DataTable.tsx
      FormBuilder.tsx
    hooks/
      useDataTable.ts
    types/
      index.ts         ← Exported types
    utils/
      validateForm.ts
  docs/
    plan.md            ← Design decisions, roadmap
    review.md          ← Code review checklist
```

---

## State Management Patterns

### Pattern 1: Local Component State (UI Only)

```typescript
export function Modal() {
  const [isOpen, setIsOpen] = useState(false);  // UI state only
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <ModalContent onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

### Pattern 2: Custom Hook (Business Logic + State)

```typescript
// hooks/useAuth.ts — Extract auth logic, not mixed with UI
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authClient.login(email, password);
      setUser(result.user);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, login };
}

// components/LoginForm.tsx — Pure presentation
export function LoginForm() {
  const { loading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={loading} type="submit">Login</button>
      {error && <p className="text-error-500">{error.message}</p>}
    </form>
  );
}
```

### Pattern 3: Context for Global State

```typescript
// context/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  login: (email, password) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }) {
  const { user, login, logout } = useAuth();  // Hook provides logic
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
```

---

## Theming with Tailwind + Chroma

### Setup `tailwind.config.ts` (extend chroma)

```typescript
import { chromaTheme } from '@canopy/chroma';

export default {
  content: ['./src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: chromaTheme.colors,
      spacing: chromaTheme.spacing,
      fontSize: chromaTheme.fontSize,
      // Add custom tokens
      colors: {
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        divider: 'hsl(var(--color-divider) / <alpha-value>)',
      },
    },
  },
  darkMode: 'class',  // Toggle dark mode with data-theme="dark"
};
```

### CSS Variables (for dynamic theming)

```css
/* styles/globals.css */
:root {
  --color-primary: 220 90% 56%;      /* Blue */
  --color-surface: 0 0% 100%;        /* White */
  --color-divider: 220 10% 90%;      /* Light gray */
}

[data-theme="dark"] {
  --color-primary: 220 90% 56%;
  --color-surface: 220 20% 10%;      /* Dark gray */
  --color-divider: 220 10% 20%;
}
```

### Component theming (semantic classes, not raw colors)

```typescript
// ✗ WRONG: Hardcoded colors
<button className="bg-blue-500 text-white">Click</button>

// ✓ CORRECT: Semantic tokens
<button className="bg-primary text-white">Click</button>
<p className="text-divider-500">Separator</p>
```

---

## Mobile-First Design Checklist

- [ ] **Breakpoints start from mobile** (default = mobile, then `sm:`, `md:`, `lg:`)
  ```tsx
  {/* Mobile: single column, Desktop: two columns */}
  <div className="flex flex-col md:flex-row gap-4">
    <Sidebar className="md:w-1/4" />
    <Main className="w-full md:w-3/4" />
  </div>
  ```

- [ ] **Touch targets ≥44px** (Tailwind: `p-3` or `h-11`)
  ```tsx
  <button className="px-4 py-3 md:px-6 md:py-2">Touch-friendly</button>
  ```

- [ ] **Responsive images** (srcSet or picture element)
  ```tsx
  <picture>
    <source srcSet="mobile.webp 375w, desktop.webp 1024w" media="(max-width: 768px)" />
    <img src="desktop.webp" alt="..." loading="lazy" />
  </picture>
  ```

- [ ] **Font sizes scale down on mobile** (`text-xs md:text-sm md:text-base`)
  ```tsx
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
  ```

- [ ] **No horizontal scroll** (max-width 100vw always)

- [ ] **Test on ≤375px viewport** (iPhone SE) before shipping

---

## Code Reuse Patterns (DRY)

### Pattern 1: Custom Hook for Shared Logic

```typescript
// hooks/useFetch.ts
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(url);
        setData(await res.json());
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  return { data, loading, error };
}

// components/UserList.tsx (reuse in 3 places)
export function UserList() {
  const { data: users } = useFetch<User[]>('/api/users');
  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Pattern 2: Compound Components (Avoid Repetition)

```typescript
// ✗ Repeated pattern
<div className="rounded-lg border border-gray-200 p-4">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="text-gray-600">{description}</p>
</div>

// ✓ Compound component
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-divider p-4">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600">{children}</p>;
}

// Usage
<Card>
  <CardTitle>{title}</CardTitle>
  <CardDescription>{description}</CardDescription>
</Card>
```

### Pattern 3: Utility Functions (Pure Logic)

```typescript
// utils/format.ts
export const formatDate = (date: Date): string => 
  new Intl.DateTimeFormat('en-US').format(date);

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Any component can import
import { formatDate, formatCurrency } from '@/utils/format';
```

### Pattern 4: Validation + Form Logic

```typescript
// hooks/useForm.ts (wrapper around React Hook Form + Zod)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function useFormWithValidation<T extends z.ZodType>(schema: T) {
  return useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
}

// components/SignupForm.tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function SignupForm() {
  const { register, formState: { errors } } = useFormWithValidation(schema);
  return (
    <form>
      <input {...register('email')} />
      {errors.email && <span className="text-error-500">{errors.email.message}</span>}
    </form>
  );
}
```

---

## Performance Optimization

### 1. Code Splitting (Lazy Routes)

```typescript
// app/routes.tsx
import React from 'react';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

export const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/settings', component: Settings },
];

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <Routes />
</Suspense>
```

### 2. Memoization (Prevent Re-renders)

```typescript
import { memo, useCallback } from 'react';

// Memoize expensive component
export const ProductCard = memo(({ product }: { product: Product }) => {
  return <div>{product.name}</div>;
}, (prev, next) => prev.product.id === next.product.id);

// Memoize callback
export function UserList() {
  const handleUserClick = useCallback((userId: string) => {
    navigate(`/user/${userId}`);
  }, [navigate]);

  return <UserCard onClick={handleUserClick} />;
}
```

### 3. Image Optimization

```typescript
// ✗ Wrong: no optimization
<img src="large-photo.jpg" alt="photo" />

// ✓ Correct: lazy load, multiple sizes, WebP
<img
  src="photo.webp"
  srcSet="photo-mobile.webp 375w, photo-desktop.webp 1024w"
  alt="photo"
  loading="lazy"
  decoding="async"
/>
```

### 4. Virtual Lists (Large Data Sets)

```typescript
import { FixedSizeList as List } from 'react-window';

export function UserList({ users }: { users: User[] }) {
  return (
    <List height={600} itemCount={users.length} itemSize={50} width="100%">
      {({ index, style }) => (
        <div style={style}>{users[index].name}</div>
      )}
    </List>
  );
}
```

---

## Separation: Business Logic vs Technical Code

### Business Logic → Custom Hooks

```typescript
// hooks/useUserManagement.ts — BUSINESS logic
export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    const response = await apiClient.get('/users');
    // Business rules: filter active, sort by name
    const filtered = response.filter(u => u.active).sort((a, b) => a.name.localeCompare(b.name));
    setUsers(filtered);
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    // Business rule: validate role
    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      throw new Error('Invalid role');
    }
    const updated = await apiClient.patch(`/users/${id}`, updates);
    setUsers(u => u.map(user => user.id === id ? updated : user));
  }, []);

  return { users, fetchUsers, updateUser };
}

// components/UserManagement.tsx — UI only (no business logic)
export function UserManagement() {
  const { users, fetchUsers, updateUser } = useUserManagement();

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>
              <select onChange={(e) => updateUser(user.id, { role: e.target.value })}>
                {/* Just UI, logic handled by hook */}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Technical Code → Utilities + Packages

```typescript
// utils/httpClient.ts — Technical utility (no business logic)
export const apiClient = {
  get: async (url: string) => {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    return res.json();
  },
  patch: async (url: string, data: any) => {
    const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(data) });
    return res.json();
  },
};
```

---

## Pixel-Perfect Design Enforcement

When implementing from Figma:

1. **Match exact dimensions** (use Figma measurements)
   ```tsx
   {/* Figma: 24px margin-bottom → Tailwind: mb-6 (1.5rem ≈ 24px) */}
   <Card className="mb-6" />
   ```

2. **Use Tailwind scale strictly** (no arbitrary values unless impossible)
   ```tsx
   {/* ✗ Avoid arbitrary */}
   <div className="w-[342px]">Wrong</div>

   {/* ✓ Use scale */}
   <div className="max-w-md">Correct (448px from scale)</div>
   ```

3. **Typography hierarchy**
   ```tsx
   {/* Figma styles: Heading XL → class: text-4xl font-bold */}
   <h1 className="text-4xl font-bold leading-tight">Heading</h1>

   {/* Body → text-base font-normal */}
   <p className="text-base font-normal leading-relaxed">Body text</p>
   ```

4. **Color precision**
   - Figma: `#3B82F6` → Use semantic token `primary` (mapped in theme)
   - Never hardcode hex; always use token

5. **Spacing consistency**
   ```tsx
   {/* All margins/padding from Tailwind scale: 0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24... */}
   <div className="p-4 gap-8">Grid</div>
   ```

---

## Verification Checklist (Before Marking Complete)

- [ ] All components in `src/components/` (not scattered)
- [ ] Business logic extracted to `hooks/` or `utils/`
- [ ] No prop-drilling >3 levels (use Context)
- [ ] All Tailwind classes used (no inline styles)
- [ ] Mobile-first responsive classes applied
- [ ] Theme tokens used (semantic, not raw colors)
- [ ] Custom hooks for duplicate logic (≤1 copy allowed, then extract)
- [ ] TypeScript types for all props and return values
- [ ] Accessibility: labels, ARIA, semantic HTML
- [ ] Performance: images optimized, lazy routes, memoization where needed
- [ ] No hardcoded dimensions (use Tailwind scale)
- [ ] Dark mode classes applied (`dark:` prefix)
- [ ] Tested on mobile viewport (≤375px)
- [ ] Code review: pixel-perfect match to Figma design

---

## Related Skills & Context

- **js-code-style**: General TypeScript/JavaScript rules (arrow functions, naming, imports)
- **js-testing**: Frontend E2E testing with Playwright (no mocks, real app)
- **ddd-package-selector**: When to create `@canopy/` packages for shared code

