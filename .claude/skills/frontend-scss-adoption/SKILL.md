---
name: frontend-scss-adoption
description: SCSS authoring rules, file layout, and token usage for the canopy design system (chroma + shadcn-modulus) AND for consumer apps (app and any app/* workspace). Use when adding or modifying SCSS anywhere in the canopy monorepo, creating or restyling a UI component, page, or app layout, adding/renaming design tokens, building a new theme, or migrating Tailwind-only pages/components into the branded SCSS layer.
---

# Frontend SCSS Adoption Skill

Use this skill whenever SCSS is touched in the canopy monorepo. It governs three layers:

1. **Design system packages** — `packages/chroma/src/**/*.scss` (tokens, themes, breakpoints) and `packages/shadcn-modulus/src/**/*.scss` (branded component SCSS).
2. **Consumer apps** — `app/src/**` (and any future `apps/*`): app-level layouts, pages, and app-local components.
3. **The seam between them** — each app's `globals.css` is the single point where the chroma preset + themes are loaded; nothing else belongs there.

Ensures every layer is themable, dark-mode safe, BEM-clean, and consistent with the existing system.

The skill assumes the architecture already in place:

- `@canopy/chroma` — single source of truth for design tokens (SCSS), themes, the Tailwind v4 preset, and `ThemeProvider`.
- `@canopy/shadcn-core` — un-branded shadcn primitives (Tailwind only, no SCSS).
- `@canopy/modulus` — atomic-design wrappers (`atoms/`, `molecules/`, `organisms/`); this is where shared component `.scss` files live.
- `demo-app` and other apps — consume the above, host their own layouts, pages, and app-local components in SCSS.

## Hard Rules (Non-Negotiable)

1. **Theme tokens only — no hardcoded design values.**
   - Colors: `var(--primary)`, `var(--background)`, `var(--success-500)`, etc.
   - Spacing: `var(--spacing-xs..6xl)`.
   - Sizing: `var(--radius*)`, `var(--shadow*)`, `var(--interactive-height-*)`.
   - Typography: `var(--font-sans)`, `var(--font-size-*)`.
   - Forbidden in component SCSS: literal `#hex`, `rgb()`, `hsl()`, `px`/`rem` for spacing/radius/font-size. If a token doesn't exist yet, add it to chroma first (see "Adding a token").

2. **Every component owns exactly one SCSS file.**
   - Lives next to the `.tsx` in the same component folder.
   - Filename is **camelCase** matching the component: `Button.tsx` → `button.scss`, `StatusPill.tsx` → `statusPill.scss`, `ListingHeaderBar.tsx` → `listingHeaderBar.scss`, `AppHeader.tsx` → `appHeader.scss`.
   - Single root block selector per file. No globals, no resets, no token re-declarations, no body/html selectors.

3. **BEM with the documented prefix split:**

   | Layer | Prefix | Example |
   |---|---|---|
   | `modulus` atoms & molecules | `ds-` | `.ds-button`, `.ds-status-pill` |
   | `modulus` organisms (layout shells) | (none) | `.app-header`, `.app-shell`, `.app-sidebar` |
   | App layouts | `layout-` | `.layout-main`, `.layout-auth` |
   | App pages | `page-` | `.page-dashboard`, `.page-live-audio` |
   | App-local components | `app-` | `.app-recording-controls`, `.app-session-list` |

   Elements: `&__element`. Modifiers: `&--modifier`. No element-of-element chains (`__a__b`) — flatten with a semantic name.

4. **State via `data-*` attributes, not class chains.**
   - React forwards `data-size="sm"`, `data-variant="primary"`, `data-state="open"`, etc.
   - SCSS targets attributes: `&[data-size='sm']`, `&[data-variant='ghost']`.
   - Do not use `.is-active`, `.has-error` style hooks.

5. **Translucent variants use `color-mix`, not opacity.**
   - `background-color: color-mix(in srgb, var(--success) 22%, transparent);`
   - Keeps the foreground at full opacity and stays theme-correct in dark mode.

6. **Breakpoints come from the centralized partial.**
   - Use `@use '@{projet-name}/chroma/scss/breakpoints' as bp;` and call `@include bp.sm { ... }` (or `bp.md`, `bp.lg`).
   - Do not write raw `@media (max-width: 640px)` in component SCSS.

7. **No `@apply`, no Tailwind utilities, no `!important` in component SCSS.**
   - Tailwind classes belong in the `.tsx` `className`. SCSS owns brand-level styling and stateful nuance.
   - The only acceptable `!important` is when overriding a third-party (radix/shadcn) inline style — comment why.

8. **Per-component import is the public contract.**
   - There is no aggregated `bundle.scss`. Consumers import what they use via `@canopy/modulus/styles/...` (each component's `.scss` is shipped as-is in `src/styles/`).
   - When you create a new component, expose its SCSS path in the package `exports` map (see "Creating a new component").

9. **Tokens are added in lock-step across every theme × mode AND the Tailwind preset.**
   - A new `--token` must land in every `themes/<theme>/<mode>/<category>.scss` file (currently `blue/light` + `blue/dark`) and `chroma/src/tailwind.css` in the same PR. The skill provides a checklist below.

10. **Dark-mode parity is verified before merge.**
    - Toggle `data-mode="dark"` on `<html>` and visually confirm the component. If anything looks wrong, the cause is almost always a hardcoded value or a missing dark-mode token — fix the token, not the component.

11. **App-level files follow the same SCSS rules as packages.**
    - Pages, layouts, and app-local components in `app` (or any `apps/*`) own their own `.scss` files using tokens, BEM, `data-*` state, and the centralized breakpoints partial.
    - `globals.css` is reserved for Tailwind directives + chroma imports + `@source` declarations. **Never** put page or component CSS in `globals.css`.
    - App-level files prefer SCSS over heavy Tailwind utility chains for any brand-meaningful surface. Tailwind utilities are still fine for one-off layout glue, but anything that defines the page or layout's visual identity belongs in SCSS.

---

## Repository Layout (reference)

```
packages/
  chroma/src/
    index.scss                         entry; @forward themes/index
    tailwind.css                       Tailwind v4 @theme inline mapping
    scss/
      breakpoints.scss                 @mixin sm/md/lg (see "Centralized breakpoints")
    themes/
      index.scss                       @forward each theme
      blue/
        index.scss                     @forward light + dark
        light/
          index.scss                   [data-theme='blue'] { @include ... }
          colors.scss                  @mixin colors { --primary-*, --background, ... }
          typography.scss              @mixin typography
          spacing.scss                 @mixin spacing
          sizing.scss                  @mixin sizing
        dark/  (same layout)
    themes-provider/
      ThemeProvider.tsx                toggles data-theme + data-mode on <html>

  shadcn-modulus/src/
    components/
      atoms/<Name>/
        <Name>.tsx                     React wrapper, sets .ds-<name> root class
        <name>.scss                    camelCase SCSS partial (BEM, tokens only)
        index.ts
      molecules/<Name>/  (same)
      organisms/<Name>/  (same, but block class drops `ds-`)
    styles/                            (legacy bundle.scss — being phased out)

app/src/                          (and any apps/* workspace)
  main.tsx                             entry; imports app/globals.css
  App.tsx                              top-level shell (wraps with Providers)
  app/
    globals.css                        Tailwind + chroma preset + themes (NO component CSS)
    providers.tsx                      ThemeProvider + other context wrappers
    page.tsx                           page component
    page.scss                          page block, .page-<name> (NO ds- prefix)
    layouts/<LayoutName>/              optional, for non-trivial app shells
      <LayoutName>.tsx
      <layoutName>.scss                .layout-<name> block (NO ds- prefix)
      index.ts
  components/<Name>/                   app-LOCAL components (not promoted to modulus)
    <Name>.tsx
    <name>.scss                        .app-<name> block (NO ds- prefix)
    index.ts
```

---

## Centralized Breakpoints

Create (if missing) `packages/chroma/src/scss/breakpoints.scss` with max-width mixins for `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px) and `sm-up` / `md-up` min-width mixins. Expose it via `"./scss/breakpoints": "./src/scss/breakpoints.scss"` in the chroma `package.json` exports.

Usage in any component, page, or layout SCSS:

```scss
@use '@canopy/chroma/scss/breakpoints' as bp;

.ds-listing-header {
  display: flex;
  gap: var(--spacing-lg);

  @include bp.sm { flex-direction: column; gap: var(--spacing-md); }
}
```

---

## Patterns

### Pattern 1: Create a new atom or molecule (uses `ds-` prefix)

Folder: `shadcn-modulus/src/components/atoms/<Name>/` with co-located `<Name>.tsx`, `<name>.scss`, `index.ts`. Single `.ds-<kebab>` block, BEM, tokens only.

```scss
// badge.scss
@use '@canopy/chroma/scss/breakpoints' as bp;

.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--foreground);
  background-color: var(--muted);

  &--success { color: var(--success); background-color: color-mix(in srgb, var(--success) 22%, transparent); }
  &--error   { color: var(--destructive); background-color: color-mix(in srgb, var(--destructive) 22%, transparent); }
  &[data-size='sm'] { padding: var(--spacing-xs) var(--spacing-sm); }
}
```

```tsx
// Badge.tsx — wire className and forward state via data-*
<span
  data-size={size}
  className={cn('ds-badge', variant !== 'default' && `ds-badge--${variant}`, className)}
  {...rest}
/>
```

Then expose the SCSS path in `packages/shadcn-modulus/package.json`:

```json
"./styles/atoms/badge": "./src/components/atoms/Badge/badge.scss"
```

### Pattern 2: Create an organism (no `ds-` prefix)

Block class is `.<kebab-name>` directly. Same BEM + tokens + breakpoint rules; only the prefix differs.

```scss
.app-toolbar {
  display: flex;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--background);
  border-bottom: 1px solid var(--border);

  &__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--foreground); }
  &--sticky { position: sticky; top: 0; z-index: 50; box-shadow: var(--shadow-sm); }
}
```

### Pattern 3: App-level adoption — pages, layouts, app-local components

This is where most consumer-side work happens. The same hard rules apply (tokens only, BEM, centralized breakpoints, no `@apply`, `data-*` state), but the **block-class prefixes are different** so it is always obvious whether a class comes from the design system or from the app:

| Where the class is defined | Prefix | Example |
|---|---|---|
| `packages/shadcn-modulus` atoms/molecules | `ds-` | `.ds-button`, `.ds-status-pill` |
| `packages/shadcn-modulus` organisms | (none — kebab name) | `.app-header`, `.app-sidebar` |
| Consumer app layouts | `layout-` | `.layout-main`, `.layout-auth` |
| Consumer app pages | `page-` | `.page-dashboard`, `.page-live-audio` |
| Consumer app local components | `app-` | `.app-recording-controls` |

#### 3a. `globals.css` is a boundary — keep it minimal

The app's `globals.css` (e.g. `app/src/app/globals.css`) loads Tailwind, the chroma Tailwind preset, the chroma themes, and declares `@source` scan paths. Nothing else.

```css
@import "tailwindcss";

@import "@canopy/chroma/preset";
@import "@canopy/chroma/themes";

@source "../**/*.{ts,tsx,js,jsx}";
@source "../../node_modules/@canopy/**/*.{ts,tsx,js,jsx,mjs}";
```

Do NOT put page styles, layout styles, body/html rules, custom resets, or component overrides here. Each of those owns its own `.scss` file.

#### 3b. App-level layouts

Layouts are the persistent shells that wrap pages (header + sidebar + content slot, auth-only centered frame, etc.). They get their own folder under `src/app/layouts/<Name>/`:

```scss
// app/src/app/layouts/MainLayout/mainLayout.scss
@use '@canopy/chroma/scss/breakpoints' as bp;

.layout-main {
  display: grid;
  grid-template-columns: 16rem 1fr;
  grid-template-areas: 'sidebar header' 'sidebar content';
  min-height: 100svh;
  background-color: var(--background);
  color: var(--foreground);

  &__sidebar { grid-area: sidebar; border-right: 1px solid var(--border); }
  &__header  { grid-area: header;  border-bottom: 1px solid var(--border); }
  &__content { grid-area: content; padding: var(--spacing-lg); overflow: auto; }

  @include bp.md {
    grid-template-columns: 1fr;
    grid-template-areas: 'header' 'content';
    &__sidebar { display: none; }
  }
}
```

```tsx
// MainLayout.tsx
import './mainLayout.scss';
import { AppHeader, AppSidebar } from '@canopy/modulus';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-main">
      <aside className="layout-main__sidebar"><AppSidebar /></aside>
      <header className="layout-main__header"><AppHeader /></header>
      <main className="layout-main__content">{children}</main>
    </div>
  );
}
```

`App.tsx` and `providers.tsx` are composition points and typically do not need their own SCSS — the visual shell lives in a layout component.

#### 3c. App-level pages

Pages get a co-located `<pageName>.scss` in the same folder as their `.tsx`, with a `.page-<name>` root class. Compose design-system components inside; use SCSS for page-specific layout, spacing, and surface decoration.

```scss
// app/src/app/page.scss
@use '@canopy/chroma/scss/breakpoints' as bp;

.page-live-audio {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background-color: var(--background);
  color: var(--foreground);

  &__title    { font-family: var(--font-sans); font-size: var(--font-size-xl); font-weight: 600; }
  &__subtitle { font-size: var(--font-size-sm); color: var(--muted-foreground); }
  &__controls { display: flex; align-items: center; gap: var(--spacing-md); }
  &__status   { font-size: var(--font-size-sm); &[data-state='error'] { color: var(--destructive); } }

  @include bp.sm {
    padding: var(--spacing-lg);
    &__controls { flex-direction: column; align-items: stretch; }
  }
}
```

```tsx
// page.tsx (excerpt — JSX shape only)
import './page.scss';
import { Button } from '@canopy/modulus';

return (
  <div className="page-live-audio">
    <h1 className="page-live-audio__title">Live Audio Streaming Demo</h1>
    <p className="page-live-audio__subtitle">Streams microphone audio over WebSocket.</p>
    <div className="page-live-audio__controls">
      <Button onClick={startListening} disabled={status === 'streaming'}>Start Listening</Button>
      <Button variant="secondary" onClick={stopListening} disabled={status === 'idle'}>Stop Listening</Button>
    </div>
    <p className="page-live-audio__status" data-state={error ? 'error' : 'ok'}>{error || `Status: ${status}`}</p>
  </div>
);
```

Notice what changed vs. the Tailwind-heavy version of this same page: layout, spacing, typography, and status coloring all moved into tokenized SCSS; the JSX stays focused on structure and behavior.

#### 3d. App-local components (not in the design system)

A component used by exactly one app — for example a recording-controls cluster, a session list row, an audio level meter — lives in `<app>/src/components/<Name>/` and uses the `app-` prefix. It still follows the BEM + tokens + breakpoints rules.

```scss
// app/src/components/RecordingControls/recordingControls.scss
@use '@canopy/chroma/scss/breakpoints' as bp;

.app-recording-controls {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--card);

  &__indicator {
    width: 0.5rem; height: 0.5rem;
    border-radius: var(--radius-full);
    background-color: var(--muted);
    &[data-state='streaming'] { background-color: var(--success); }
    &[data-state='error']     { background-color: var(--destructive); }
  }

  @include bp.sm { flex-direction: column; }
}
```

If an `app-*` component starts being used by multiple apps, **promote it** to `@canopy/modulus` (rename the block to `ds-<name>` and move into `atoms/molecules/organisms`).

#### 3e. SCSS imports — who imports what

Co-locate, then import from the owning `.tsx`. This keeps tree-shaking honest and means deleting a page/layout/component takes its SCSS with it.

```tsx
// at the top of the owning .tsx
import './mainLayout.scss';
import './page.scss';
import './recordingControls.scss';
```

For design-system components imported from `@canopy/modulus`, import their SCSS once at the app root (or once per route bundle):

```tsx
// app/src/main.tsx or App.tsx — pick the styles you actually use
import '@canopy/modulus/styles/atoms/button';
import '@canopy/modulus/styles/atoms/input';
import '@canopy/modulus/styles/organisms/appHeader';
```

If your bundler doesn't yet allow extensionless SCSS imports, append `.scss` (e.g. `@canopy/modulus/styles/atoms/button.scss`). The exact paths come from the `exports` map in `packages/shadcn-modulus/package.json`.

### Pattern 4: Migrating a Tailwind-heavy page to SCSS

Use this when you encounter a page like `app/src/app/page.tsx` that does most of its styling via Tailwind utility chains (`"p-6 space-y-4"`, `"px-4 py-2 rounded border border-border"`, `"text-sm text-red-500"`).

Step by step:

1. **Pick the block name** — `page-<kebab>` for a page, `layout-<kebab>` for a layout, `app-<kebab>` for a local component.
2. **Create the co-located `.scss`** with that single root block and the `@use` for breakpoints.
3. **Walk the JSX** top-down. For each element, decide:
   - Is the utility chain expressing **brand identity** (color, font, radius, shadow, spacing rhythm)? → move it to a BEM element in SCSS, swap literals for tokens.
   - Is it **layout glue** (flex, grid, gap with token values, min-width-0)? → either keep as Tailwind classes or move to SCSS, but never mix `@apply` into the SCSS.
   - Is it **state** (disabled, loading, error, open)? → drive it from a `data-*` attribute and style with `&[data-state='...']`.
4. **Replace any hardcoded `text-red-500`, `border-border`, `px-4 py-2`** etc. with token-based properties. If a token is missing, add it (Pattern 5).
5. **Replace inline event-based class swaps** (`status === 'error' ? 'text-red-500' : ''`) with `data-state` attributes.
6. **Import the new `.scss`** at the top of the page/layout/component.
7. **Verify in both modes** by toggling `data-mode` on `<html>`.

Concrete before/after for one element:

```tsx
// BEFORE — Tailwind-only, hardcoded color name
{error ? <p className="text-sm text-red-500">{error}</p> : null}

// AFTER — token-driven, state via data attribute
<p className="page-live-audio__status" data-state={error ? 'error' : 'ok'}>
  {error}
</p>
```

```scss
.page-live-audio__status {
  font-size: var(--font-size-sm);
  color: var(--foreground);

  &[data-state='error'] { color: var(--destructive); }
}
```

### Pattern 5: Add a new design token

Touch **every** theme × mode file plus the Tailwind preset in the same PR.

1. Add the CSS custom property inside the relevant `@mixin` block in `packages/chroma/src/themes/blue/light/<category>.scss` and `…/dark/<category>.scss`. Pick the right category file (`colors`, `spacing`, `sizing`, `typography`).
2. Map it for Tailwind in `packages/chroma/src/tailwind.css`:

   ```css
   @theme inline {
     --color-brand-accent: var(--brand-accent);
   }
   ```

3. If the token has tonal scales (50/100/500/700/900), add all five in both light and dark.
4. Rebuild `@canopy/chroma` and visually verify in `app` with both `data-mode="light"` and `data-mode="dark"`.

Token-addition checklist:

```
- [ ] Added to themes/blue/light/<category>.scss
- [ ] Added to themes/blue/dark/<category>.scss
- [ ] (If multi-theme) added to every other theme's light + dark
- [ ] Mapped under @theme inline in chroma/src/tailwind.css
- [ ] Built chroma (tsup) and saw the var in dist/css/themes/blue/light.css
- [ ] Used the token in at least one component to validate
```

### Pattern 6: Add a new theme

Mirror the `blue/` folder under `packages/chroma/src/themes/<theme>/{light,dark}/` (same four category files + `index.scss`). Scope each mode's mixins under `[data-theme='<theme>']`. Add `@forward '<theme>/index'` to `themes/index.scss`. Add per-theme tsup outputs in `packages/chroma/tsup.config.ts` and the corresponding `exports` entries in `packages/chroma/package.json`. Wire the new theme into the app's `ThemeProvider`.

### Pattern 7: Migrate a Tailwind-only component into the modulus layer

Wrap the core component in `shadcn-modulus/src/components/<layer>/<Name>/`, add the root class via `cn(...)` (`ds-<name>` for atom/molecule, `<name>` for organism), create the co-located `<name>.scss`, translate brand-defining Tailwind utilities (font, transition, focus ring, surface colors) into token-driven SCSS, expose the SCSS path in the `modulus` `exports` map, and import it from the consumer.

---

## Hard "Do Not" List (one-line reminders)

Hardcoded `#hex`/`rgb()`/`hsl()`/`px`/`rem` design values · raw `@media (max-width: ...)` · `@apply` · `!important` (except documented third-party overrides) · multiple block roots per file · re-declaring CSS custom properties outside chroma · dimming via parent opacity instead of `color-mix` · state hooks like `.is-loading`/`.has-error` instead of `data-*` · putting page/layout/component CSS in `globals.css` · adding a new modulus component without an entry in the `exports` map.

---

## New-Component SCSS Checklist (use on every PR)

```
- [ ] Component folder under atoms/, molecules/, or organisms/
- [ ] .tsx and .scss co-located, both camelCase-matched to the component name
- [ ] Root class: ds-<kebab> for atom/molecule, <kebab> for organism
- [ ] BEM elements use &__element; modifiers use &--modifier
- [ ] All colors/spacing/radii/typography reference chroma tokens
- [ ] Breakpoints via @use '@canopy/chroma/scss/breakpoints'
- [ ] State driven by data-* attributes, not class hooks
- [ ] Translucent fills via color-mix(in srgb, var(--token) X%, transparent)
- [ ] No @apply / Tailwind utilities / !important / opacity hacks
- [ ] SCSS path added to packages/shadcn-modulus/package.json "exports"
- [ ] Verified in light AND dark mode (toggle data-mode on <html>)
- [ ] Consumer (app or app) imports the component's SCSS path
```

---

## App-Level Adoption Checklist (pages, layouts, app-local components)

```
- [ ] globals.css contains ONLY tailwindcss + chroma preset + chroma themes + @source directives
- [ ] No page/layout/component CSS leaked into globals.css
- [ ] Each page has a co-located <pageName>.scss with a single .page-<kebab> block
- [ ] Each layout has a co-located <layoutName>.scss with a single .layout-<kebab> block
- [ ] Each app-local component lives under <app>/src/components/<Name>/ with .app-<kebab> root
- [ ] camelCase scss filename matching the .tsx component name
- [ ] SCSS file imported at the top of its owning .tsx
- [ ] All colors / spacing / radii / typography reference chroma tokens (no hardcoded hex/px/rem)
- [ ] Breakpoints via @use '@canopy/chroma/scss/breakpoints' as bp;
- [ ] Visual state driven by data-* attributes, not className branching
- [ ] No @apply, no Tailwind utilities, no !important inside the .scss file
- [ ] Design-system component SCSS imported once (typically in App.tsx or main.tsx) via @canopy/modulus/styles/...
- [ ] Verified in BOTH data-mode='light' and data-mode='dark'
- [ ] If a local app-* component is reused across apps, plan to promote it to @canopy/modulus
```

---

## Common Failure Modes (and the fix)

| Symptom | Root cause | Fix |
|---|---|---|
| Component looks fine in light, broken in dark | Hardcoded color or `rgba(0,0,0,...)` shadow | Replace with `var(--token)` or `color-mix(in srgb, var(--foreground) X%, transparent)` |
| Theme switch leaves stale colors | Component bypasses `data-theme`/`data-mode` (e.g. inline `style`) | Move styling to `.scss` using tokens |
| Tailwind class doesn't pick up new token | Token wasn't mapped in `chroma/src/tailwind.css` | Add the `@theme inline { --color-... }` mapping |
| Spinning or shifting layout on mobile | Inline `@media` mismatched with shared breakpoints | Replace with `@include bp.sm` / `bp.md` |
| Two components style differently at the same size | Both invented their own size scale | Use `data-size` + `var(--interactive-height-*)` + token-based padding |
| Page styles leak into other routes | Rules were dropped into `globals.css` | Move them into the owning `<pageName>.scss` with a `.page-<name>` block |
| App-local component styling drifts from design-system look | Tailwind utility chains in JSX with hardcoded colors | Migrate to `<componentName>.scss` with `.app-<name>` block and tokens (Pattern 4) |
| Same custom component duplicated across apps | Lived only as `.app-*` in one app | Promote to `@canopy/modulus` and rename to `.ds-<name>` (atom/molecule) or unprefixed (organism) |

---

## Related Skills

- **frontend-component-documentation** — README, JSDoc, and Storybook patterns for each component. Pairs with this skill: this one governs *how* a component is styled; that one governs *how* a component is documented.
