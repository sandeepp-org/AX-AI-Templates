cat > /Users/sandeeppatil/Documents/GitHub/canopy/README.md << 'EOF'
# Canopy Design System

A modern, multi-theme React component library built with Shadcn UI, Tailwind CSS, and TypeScript. Canopy provides a comprehensive design system with semantic color tokens, theme switching, and attribute-based component styling.

## Architecture Overview

### Monorepo Structure

Canopy is organized as a monorepo using `pnpm` workspaces with Turbo for build orchestration.

```
canopy/
├── apps/
│   └── demo-app/              # Showcase application
├── packages/
│   ├── chroma/                # Theme & color system
│   ├── shadcn-core/           # Core Shadcn UI components
│   ├── shadcn-modulus/        # Extended Shadcn components
│   └── frontend-utils/        # Shared utilities
├── docs/                      # Documentation
├── pnpm-workspace.yaml        # Workspace configuration
├── turbo.json                 # Build pipeline config
└── tsconfig.json              # Root TypeScript config
```

### Core Packages

#### 1. **@canopy/chroma** - Theme & Color System
Manages all theme-related functionality including:
- **Color Tokens**: Semantic color variables (primary, secondary, accent, destructive, etc.)
- **Theme Provider**: React context for theme switching (light/dark mode)
- **Tailwind Plugin**: Custom CSS generation for attribute-based styling
- **Theme Utilities**: Helper functions for color resolution and theme initialization

**Key Files:**
- `src/tailwind-plugin.ts` - Generates CSS for `data-size` and `data-variant` attributes
- `src/themes-provider/` - Theme context and provider implementation
- `src/index.ts` - Exports theme utilities and color system

#### 2. **@canopy/shadcn-core** - Base Components
Provides foundational Shadcn UI components:
- Button component with variants (default, destructive, outline, secondary, ghost, link)
- Base styling and accessibility features
- Built with Radix UI primitives

#### 3. **@canopy/shadcn-modulus** - Extended Components
Extends core components with custom variants and sizes:
- **Button Component**: 
  - Custom sizes: `sm`, `sm-loose`, `default`, `lg`, `icon`
  - Data attribute support for dynamic styling
  - Passes `data-size` and `data-variant` to enable Tailwind plugin CSS
- **Providers**: Theme provider re-export
- **Hooks**: Custom React hooks (useTheme)

**Key Implementation:**
```typescript
// Button with data attributes for Tailwind plugin styling
if (size === "sm-loose") {
  return (
    <CoreButton
      data-size={size}
      data-variant={variant}
      size="default"
      variant={variant}
      className={extendedButtonVariants({ variant, size, className })}
      {...props}
    />
  )
}
```

#### 4. **@canopy/frontend-utils** - Shared Utilities
Common utility functions and helpers used across packages.

### Styling Architecture

#### CSS Cascade
1. **Tailwind Base Styles** - Reset and base element styles
2. **Component Classes** - CVA (class-variance-authority) generated classes
3. **Tailwind Plugin CSS** - Data attribute-based overrides with `!important`
4. **Inline Styles** - Last resort for dynamic styling

#### Data Attribute Styling
The Tailwind plugin (`@canopy/chroma/src/tailwind-plugin.ts`) provides CSS for:
- `button[data-size="sm-loose"]` - 28px height, 12px padding
- `button[data-size="sm"]` - 28px height, 8px padding
- `button[data-size="default"]` - 36px height, 16px padding
- `button[data-size="lg"]` - 40px height, 32px padding
- `button[data-variant="*"]` - Color variants (default, outline, destructive, secondary, ghost, link)

### Theme System

#### Color Tokens
Semantic color variables defined in CSS custom properties:
- **Semantic**: primary, secondary, accent, muted, destructive, success, warning, info
- **UI Colors**: background, foreground, card, popover, border, input, ring
- **Status Colors**: status-pending, status-active, status-inactive, status-processing
- **Data Visualization**: color-data-1 through color-data-5

#### Theme Switching
- Light/Dark mode support via CSS custom properties
- React Context for theme state management
- `useTheme()` hook for accessing theme utilities

### Demo Application

Located in `apps/demo-app/`, showcases:
- All button variants and sizes
- Theme color palette
- Component usage patterns
- Data attribute styling examples

## Build Pipeline

### Turbo Configuration
Defines build tasks and dependencies:
- `build` - Compiles all packages
- `dev` - Runs development servers with hot reload
- Caches build artifacts for faster rebuilds

### TypeScript Configuration
- Root `tsconfig.json` with shared compiler options
- Package-specific configs extending root config
- Module resolution: `bundler` for modern bundlers

### Build Tools
- **tsup** - TypeScript bundler for packages
- **Vite** - Demo app bundler
- **Tailwind CSS v4** - Utility-first CSS framework
- **SASS** - CSS preprocessing

## Development Workflow

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```
Starts all packages in watch mode with hot module replacement.

### Building
```bash
pnpm build
```
Builds all packages in dependency order using Turbo.

### Clean Build
```bash
pnpm clean && pnpm install && pnpm build && pnpm dev
```

## Component Usage

### Basic Button
```tsx
import { Button } from '@canopy/shadcn-modulus'

export default function App() {
  return (
    <Button variant="default" size="default">
      Click me
    </Button>
  )
}
```

### With Data Attributes
```tsx
<Button size="sm-loose" variant="outline">
  Small Loose Button
</Button>
```

### Theme Switching
```tsx
import { useTheme } from '@canopy/chroma'

export default function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

## Key Design Decisions

1. **Monorepo with Turbo** - Enables efficient builds and shared dependencies
2. **Data Attributes for Styling** - Allows CSS-based customization without modifying component props
3. **Tailwind Plugin** - Centralizes attribute-based styles in one place
4. **CVA for Variants** - Type-safe component variant management
5. **CSS Custom Properties** - Enables runtime theme switching without CSS-in-JS
6. **Semantic Color Tokens** - Improves maintainability and consistency

## Future Enhancements

- Additional component types (Input, Select, Dialog, etc.)
- Animation system
- Accessibility improvements
- Component documentation site
- Storybook integration
EOF
