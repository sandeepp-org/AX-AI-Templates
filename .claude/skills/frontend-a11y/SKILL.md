---
name: frontend-a11y
description: Accessibility (A11y) best practices for reusable React components. Enforces WCAG compliance, ARIA patterns, keyboard navigation, semantic HTML, screen reader testing, and inclusive design patterns. Use when building or maintaining components in @canopy/* packages.
---

# Frontend Accessibility (A11y) Skill

Use this skill when building reusable components in `front-end/packages/@canopy/*` or adding accessibility features to `front-end/app/src/`. Ensures components are usable by everyone, including people with disabilities.

## Hard Rules (Non-Negotiable)

1. **Semantic HTML first**
   - Use correct HTML elements: `<button>` not `<div onClick>`, `<form>` for forms, `<nav>` for navigation
   - Use heading hierarchy (`<h1>` → `<h2>` → `<h3>`, never skip levels)
   - Use `<label>` for form fields, linked with `htmlFor`
   - Use `<fieldset>` + `<legend>` for grouped controls (radio buttons, checkboxes)

2. **ARIA only when HTML can't do it**
   - **First choice**: Semantic HTML (`<button>`, `<input type="checkbox">`)
   - **Second choice**: ARIA attributes (`aria-label`, `aria-describedby`, `role="button"`)
   - Never hide semantic meaning with ARIA role overrides (e.g., never use `role="button"` on a `<div>` when `<button>` exists)
   - Test with screen reader before shipping

3. **Keyboard navigation mandatory**
   - All interactive elements must be reachable via `Tab`
   - Logical tab order (left-to-right, top-to-bottom)
   - Provide visible focus indicator (never remove `outline` without replacement)
   - Implement keyboard shortcuts: `Escape` to close modals, `Enter`/`Space` to activate buttons
   - For custom components, manage focus with `useRef` + `.focus()`

4. **Color accessibility (WCAG AA minimum)**
   - Contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text (18px+)
   - Never use color alone to convey meaning (e.g., "required fields are red" → add asterisk `*`)
   - Test with contrast checker before shipping
   - Support dark mode with adequate contrast in both modes

5. **Images & media**
   - Always include `alt` text (descriptive, not "image", "photo", or "pic")
   - For decorative images: `alt=""` (empty string, hidden from screen readers)
   - For complex images: long description via `aria-describedby` or linked caption
   - Videos must have captions + transcripts

6. **Form accessibility**
   - Every `<input>` must have associated `<label>`
   - Error messages linked to input: `aria-describedby="error-id"`
   - Validation messages displayed in real-time or on form submit
   - Use `aria-required="true"` or HTML `required` attribute
   - On form error, focus returns to first invalid field

7. **Motion & animation**
   - Respect `prefers-reduced-motion` media query
   - Provide pause/play controls for auto-playing content
   - Avoid flashing (>3 times per second triggers seizures)

8. **Testing is not optional**
   - Test with keyboard only (no mouse)
   - Test with screen reader (NVDA on Windows, VoiceOver on Mac)
   - Use automated tools (axe DevTools, Lighthouse A11y audit) in CI
   - Manual accessibility testing on every component before merging

---

## Component A11y Patterns

### Pattern 1: Accessible Button Component

```typescript
// ✗ WRONG: Not keyboard accessible
<div onClick={handleClick} role="button">
  Click me
</div>

// ✓ CORRECT: Semantic button with focus styling
export function Button({ 
  onClick, 
  children, 
  disabled = false,
  ariaLabel,
  type = 'button'
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}  // For icon buttons
      className={cn(
        'px-4 py-2 rounded font-medium',
        'focus:outline-2 focus:outline-offset-2 focus:outline-primary',
        'hover:bg-primary-600 active:bg-primary-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Respect prefers-reduced-motion
        'motion-safe:transition-colors',
      )}
    >
      {children}
    </button>
  );
}
```

### Pattern 2: Accessible Form Input

```typescript
// ✗ WRONG: No label, no error link
<input type="email" placeholder="Email" />

// ✓ CORRECT: Label, error messaging, validation
export function FormInput({
  label,
  id,
  error,
  required,
  ...props
}: FormInputProps) {
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        required={required}
        className={cn(
          'w-full px-3 py-2 border rounded',
          error ? 'border-error-500' : 'border-divider'
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-error-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Pattern 3: Accessible Modal/Dialog

```typescript
// ✓ CORRECT: Focus management, keyboard escape, semantic structure
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save focus to restore later
      previousActiveRef.current = document.activeElement as HTMLElement;
      // Focus modal
      setTimeout(() => modalRef.current?.focus(), 0);
    } else if (previousActiveRef.current) {
      previousActiveRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with proper ARIA */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal with semantic role */}
      <dialog
        ref={modalRef}
        open
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-lg p-6"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <div>{children}</div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          aria-label="Close modal"
        >
          Close
        </button>
      </dialog>
    </>
  );
}
```

### Pattern 4: Accessible Dropdown/Select Menu

```typescript
// ✓ CORRECT: Keyboard arrow navigation, ARIA attributes
export function Dropdown({
  options,
  value,
  onChange,
  label,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const index = options.findIndex(opt => opt.value === (highlighted || value));
      setHighlighted(options[Math.min(index + 1, options.length - 1)].value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const index = options.findIndex(opt => opt.value === (highlighted || value));
      setHighlighted(options[Math.max(index - 1, 0)].value);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted) {
        onChange(highlighted);
        setIsOpen(false);
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="relative inline-block">
      <label htmlFor="dropdown-button" className="text-sm font-medium">
        {label}
      </label>
      <button
        ref={buttonRef}
        id="dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="dropdown-list"
        className="w-full px-3 py-2 border border-divider rounded focus:outline-2 focus:outline-primary"
      >
        {options.find(opt => opt.value === value)?.label} ▼
      </button>
      {isOpen && (
        <ul
          ref={listRef}
          id="dropdown-list"
          role="listbox"
          onKeyDown={handleKeyDown}
          className="absolute top-full left-0 right-0 bg-white border border-divider rounded shadow-lg mt-1 z-10"
        >
          {options.map(option => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'px-3 py-2 cursor-pointer',
                value === option.value ? 'bg-primary text-white' : 'hover:bg-gray-100'
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Pattern 5: Skip to Main Content Link

```typescript
// Place at start of layout
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2"
    >
      Skip to main content
    </a>
  );
}

// In layout
export function Layout() {
  return (
    <>
      <SkipLink />
      <header>Navigation</header>
      <main id="main-content">Content</main>
    </>
  );
}
```

---

## WCAG Guidelines Quick Reference

### WCAG 2.1 Level AA (Minimum Standard)

| Guideline | Requirement | Example |
|-----------|-------------|---------|
| **Perceivable** | Content must be perceivable to all senses | Add alt text, captions, color + icons |
| **Operable** | All functionality via keyboard | All buttons tabbable, modals closeable with Escape |
| **Understandable** | Clear language, predictable patterns | No jargon, consistent navigation |
| **Robust** | Compatible with assistive tech | Valid HTML, proper ARIA, semantic elements |

### Common Issues & Fixes

| Issue | Problem | Fix |
|-------|---------|-----|
| Missing labels | Screen reader can't identify inputs | Add `<label htmlFor>` |
| Low contrast | Hard to read for low-vision users | Ensure 4.5:1 contrast ratio |
| No keyboard nav | Can't navigate without mouse | Tab order, focus visible, arrow keys |
| Missing alt text | Images not described | Write descriptive alt or use `alt=""` for decorative |
| Color only | Can't distinguish meaning | Add text/icons alongside color |
| Unlabeled buttons | Screen reader says "button" | Add `aria-label` or text content |
| Flashing content | Can trigger seizures | Avoid flashing >3x/sec |

---

## Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Focus visible at all times (not invisible)
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys work in custom widgets

### Screen Reader (NVDA/VoiceOver)
- [ ] All text content readable
- [ ] Button purposes clear (not just "click here")
- [ ] Form labels announced
- [ ] Errors announced with `role="alert"`
- [ ] Landmark regions recognized (`<nav>`, `<main>`, `<footer>`)
- [ ] Hidden decorative elements skipped (`aria-hidden="true"`)

### Color & Contrast
- [ ] Text contrast ≥4.5:1 (normal), ≥3:1 (large)
- [ ] Meaning not conveyed by color alone
- [ ] Dark mode maintains contrast

### Motion & Animation
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No flashing >3 times/second
- [ ] Auto-playing content has pause control

### Automated Tools
```bash
# Run in your Playwright E2E tests
import { injectAxe, checkA11y } from 'axe-playwright';

test('home page is accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);  // Fails if violations found
});
```

---

## CSS Utilities for A11y

Add these utilities to your Tailwind config:

```css
/* Screen reader only (visually hidden but available to assistive tech) */
@layer utilities {
  .sr-only {
    @apply absolute w-1 h-1 p-0 -m-1 overflow-hidden clip-path-[inset(50%)];
  }

  .focus-visible {
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary;
  }

  /* Respect user's motion preference */
  @media (prefers-reduced-motion: reduce) {
    * {
      @apply !motion-safe:transition-none !motion-safe:animate-none;
    }
  }
}
```

---

## Related Skills

- **frontend-architecture**: Component design, structure, state management
- **js-testing**: Accessibility testing in Playwright E2E suite
- **frontend-component-documentation**: Document accessibility features in Storybook

