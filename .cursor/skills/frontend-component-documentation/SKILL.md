---
name: frontend-component-documentation
description: Component documentation and Storybook patterns for reusable React components. Enforces discoverable, well-documented components with clear props, variants, examples, and accessibility notes for team reusability.
---

# Frontend Component Documentation Skill

Use this skill when documenting reusable components in `front-end/packages/@canopy/*`. Ensures components are discoverable, understandable, and easy for the team to use correctly.

## Hard Rules (Non-Negotiable)

1. **Every component must have a README**
   - Purpose statement (1 sentence)
   - When to use (vs alternatives)
   - Installation/import instructions
   - Complete props table with types and defaults
   - Real-world usage examples (copy-paste ready)
   - Accessibility notes
   - Keyboard shortcuts (if interactive)

2. **Storybook stories for every component variant**
   - One story per use case (button primary, secondary, disabled, loading, etc.)
   - Story title hierarchy: `Category/Component/Variant` (e.g., `Forms/Input/Default`)
   - Every story has controls for interactive props (argTypes)
   - A "Default" story showing basic usage
   - A "All Variants" story showing all states together
   - Real data in stories (not placeholder "Lorem Ipsum")

3. **TypeScript props are documentation**
   - Props must have JSDoc comments above type definition
   - Use discriminated unions for variant-specific props
   - Mark optional props with `?`
   - Provide good default values
   - Export prop types so consumers can import them

4. **Live examples beat written explanation**
   - Show common use cases in stories
   - Include error states, loading states, edge cases
   - Interactive controls let consumers tweak props in real-time
   - Link to related components

5. **Accessibility documented**
   - Note WCAG compliance level (AA minimum)
   - List keyboard shortcuts in accessibility section
   - Document ARIA attributes used
   - Note screen reader behavior
   - Include accessibility test results

6. **Keep docs in sync with code**
   - JSDoc comments are maintainable (live in code)
   - README stays updated (add to PR checklist)
   - Storybook stories auto-update with prop changes
   - Version component when breaking changes occur

---

## File Structure & Format

### Component folder structure

```
shadcn-modulus/
  src/
    Button/
      Button.tsx          ← Component implementation
      Button.types.ts     ← Props types with JSDoc
      Button.stories.tsx  ← Storybook stories
      README.md           ← Component documentation
      accessibility.md    ← A11y details (optional)
    index.ts
  docs/
    COMPONENTS.md         ← Global component overview
```

---

## Documentation Patterns

### Pattern 1: Component with JSDoc Props

```typescript
// Button.types.ts
import React from 'react';

/**
 * Variant of the button styling.
 * - `primary`: Main call-to-action button (blue background)
 * - `secondary`: Less prominent action (gray background)
 * - `ghost`: Minimal style, text only
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Size preset for padding and font size.
 * - `sm`: Small button, suitable for compact layouts
 * - `md`: Default size, recommended for most cases
 * - `lg`: Large button for mobile or prominent CTAs
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size preset.
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Show loading spinner and disable interaction.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Make button full width of container.
   * @default false
   */
  isFullWidth?: boolean;

  /**
   * Text to show in loading state (if different from children).
   * @example 'Submitting...'
   */
  loadingText?: string;

  /**
   * Icon component to render before text.
   * @example <IconCheck />
   */
  icon?: React.ReactNode;

  /**
   * ARIA label for accessibility (required for icon-only buttons).
   * @example 'Close menu'
   */
  ariaLabel?: string;
}
```

### Pattern 2: Component README

```markdown
# Button

Primary interactive element for user actions. Use for form submissions, navigation, and calls-to-action.

## When to Use

- **Button**: Main form submissions, navigation actions
- **Link**: Navigate between pages (use `<a>` or router)
- **IconButton**: Icon-only buttons with no text
- **Split Button**: Multiple related actions

## Installation

```tsx
import { Button } from '@canopy/shadcn-core';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `isLoading` | `boolean` | `false` | Show loading state |
| `isFullWidth` | `boolean` | `false` | Stretch to container width |
| `loadingText` | `string` | - | Text during loading |
| `icon` | `ReactNode` | - | Icon before text |
| `ariaLabel` | `string` | - | ARIA label (required for icon-only) |
| `disabled` | `boolean` | `false` | Disable interaction |
| `onClick` | `(e) => void` | - | Click handler |

## Basic Usage

```tsx
import { Button } from '@canopy/shadcn-core';

export function MyForm() {
  const handleSubmit = () => alert('Submitted!');

  return (
    <Button onClick={handleSubmit}>
      Submit
    </Button>
  );
}
```

## Variants

### Primary (Default)
Main call-to-action button for forms, dialogs, important actions.

```tsx
<Button variant="primary">Save Changes</Button>
```

### Secondary
Less prominent action, alternative to primary.

```tsx
<Button variant="secondary">Cancel</Button>
```

### Ghost
Minimal style, text-only, suitable for tertiary actions.

```tsx
<Button variant="ghost">Skip</Button>
```

## Sizes

### Small
Compact, for dense layouts or secondary actions.

```tsx
<Button size="sm">Small</Button>
```

### Medium (Default)
Standard size for most use cases.

```tsx
<Button size="md">Medium</Button>
```

### Large
Prominent, suitable for mobile or important CTAs.

```tsx
<Button size="lg">Large</Button>
```

## States

### Loading
Disable and show spinner while async action completes.

```tsx
export function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await submitForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button isLoading={isLoading} loadingText="Submitting...">
      Submit
    </Button>
  );
}
```

### Disabled
Prevent interaction, gray out styling.

```tsx
<Button disabled>Disabled</Button>
```

### Full Width
Stretch button to fill container.

```tsx
<Button isFullWidth>Full Width Button</Button>
```

### With Icon
Icon rendered before text.

```tsx
import { IconCheck } from '@canopy/icons';

<Button icon={<IconCheck />}>Save</Button>
```

### Icon Only
For icon buttons, always include `ariaLabel`.

```tsx
<Button 
  variant="ghost" 
  icon={<IconClose />} 
  ariaLabel="Close menu"
/>
```

## Accessibility

- **WCAG Level**: AA compliant
- **Keyboard**: Tab-focusable, Enter/Space to activate
- **Screen Reader**: Button purpose clear from text or `ariaLabel`
- **Focus**: Visible outline on focus, no outline removal
- **Motion**: Respects `prefers-reduced-motion` preference

## Related Components

- [`IconButton`](../IconButton/README.md): Icon-only button variant
- [`Link`](../Link/README.md): For navigation between pages
- [`ButtonGroup`](../ButtonGroup/README.md): Multiple buttons with shared state
```

### Pattern 3: Storybook Stories

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { IconCheck, IconClose } from '@canopy/icons';

/**
 * Primary interactive element for user actions.
 *
 * - Use `variant="primary"` for main CTAs
 * - Use `variant="secondary"` for alternative actions
 * - Use `variant="ghost"` for tertiary/minimal actions
 */
const meta = {
  title: 'Forms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size preset',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable interaction',
    },
    isFullWidth: {
      control: 'boolean',
      description: 'Stretch to container width',
    },
    children: {
      control: 'text',
      description: 'Button text',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story: primary variant, medium size
export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
  },
};

// All variants together
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

// All sizes together
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  args: {
    children: 'Submit',
    isLoading: true,
    loadingText: 'Submitting...',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    isFullWidth: true,
  },
};

// Icon button
export const WithIcon: Story = {
  args: {
    children: 'Save',
    icon: <IconCheck />,
  },
};

// Icon-only (always requires ariaLabel)
export const IconOnly: Story = {
  args: {
    icon: <IconClose />,
    ariaLabel: 'Close',
    variant: 'ghost',
  },
};

// Real-world example: form submit
export const FormSubmit: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
      }}>
        <input
          type="email"
          placeholder="Enter email"
          required
          className="px-3 py-2 border rounded mr-2"
        />
        <Button
          type="submit"
          isLoading={isLoading}
          loadingText="Sending..."
        >
          Subscribe
        </Button>
      </form>
    );
  },
};
```

### Pattern 4: Accessibility Documentation

```markdown
# Button Accessibility

## WCAG Compliance

- **Level**: AA
- **Perceivable**: High contrast colors (4.5:1 text ratio)
- **Operable**: Keyboard accessible (Tab, Enter, Space)
- **Understandable**: Clear purpose, consistent behavior
- **Robust**: Semantic HTML, valid ARIA

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus button |
| `Shift+Tab` | Focus previous element |
| `Enter` | Activate button |
| `Space` | Activate button |

## Screen Reader

### Labeled Button
```tsx
<Button>Save</Button>
```
Screen reader reads: "Save, button"

### Icon-Only Button (Requires ariaLabel)
```tsx
<Button icon={<IconClose />} ariaLabel="Close dialog" />
```
Screen reader reads: "Close dialog, button"

### Button Group
```tsx
<fieldset aria-label="Pagination">
  <Button>Previous</Button>
  <Button>Next</Button>
</fieldset>
```

## Testing

### Manual Testing
- [ ] Tab through button, focus visible
- [ ] Press Enter to activate
- [ ] Press Space to activate
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Test in dark mode for contrast
- [ ] Verify loading state is announced

### Automated Testing
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('button is keyboard accessible', async () => {
  const { getByRole } = render(<Button>Click me</Button>);
  const button = getByRole('button');
  
  // Tab focus
  await userEvent.tab();
  expect(button).toHaveFocus();
  
  // Activate with Enter
  await userEvent.keyboard('{Enter}');
  // verify action
});
```
```

---

## Storybook Setup

### Install Storybook

```bash
npx storybook init
```

### Configure storybook.config.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',  // A11y testing
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: true,  // Auto-generate docs from JSDoc + stories
  },
};

export default config;
```

### Run Storybook

```bash
npm run storybook  # Start dev server
npm run storybook:build  # Build static site
```

---

## Documentation Checklist

For every component before merging:

- [ ] **Component implementation** complete and tested
- [ ] **JSDoc comments** on all props with examples
- [ ] **README.md** with:
  - [ ] Purpose (1 sentence)
  - [ ] When to use vs alternatives
  - [ ] Installation/import
  - [ ] Complete props table
  - [ ] 3+ real-world examples
  - [ ] Related components
- [ ] **Storybook stories** with:
  - [ ] Default story
  - [ ] All variants story
  - [ ] All sizes story
  - [ ] All interactive states (loading, disabled, etc.)
  - [ ] Real-world usage example
  - [ ] Icon-only variant (if applicable)
- [ ] **Accessibility documentation**:
  - [ ] WCAG level stated
  - [ ] Keyboard shortcuts listed
  - [ ] ARIA attributes documented
  - [ ] Screen reader behavior noted
- [ ] **TypeScript types** exported for consumers
- [ ] **No breaking changes** without version bump
- [ ] **Reviewed** by team before ship

---

## Example Component Package

Full component package with documentation:

```
Button/
  ├── Button.tsx
  ├── Button.types.ts
  ├── Button.test.tsx
  ├── Button.stories.tsx
  ├── README.md
  └── accessibility.md
```

---

## Related Skills

- **frontend-architecture**: Component design, folder structure, reusability
- **frontend-a11y**: Deep-dive into accessibility requirements
- **js-code-style**: TypeScript/JSDoc best practices

