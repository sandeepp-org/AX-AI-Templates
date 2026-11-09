---
name: frontend-testing
description: End-to-end and integration testing for React applications using Playwright. Covers user interactions, form validation, navigation, accessibility, and all UI flows against a real running app. No mocks, no JSDOM—real browser testing only.
---

# Frontend Testing Skill

Use this skill when writing tests for `front-end/app/` or `front-end/packages/`. Enforces real E2E testing via Playwright against a live application—never mock routers, stores, HTTP clients, or component internals.

## Hard Rules (Non-Negotiable)

1. **Playwright E2E only—no mocks**
   - Test against a real running app (dev server must be running)
   - No mocking of fetch, routers, state management, or React internals
   - No JSDOM-only unit tests for UI flows (those hide integration bugs)
   - Real HTTP calls (mock server if needed, not fetch)
   - Real navigation with router

2. **Test file location & naming**
   - E2E tests: `front-end/app/e2e/**/*.spec.ts` (separate from source)
   - Not co-located with components (unlike backend tests)
   - Naming: descriptive feature/flow name (e.g., `user-login.spec.ts`, `product-checkout.spec.ts`)
   - One test file per user flow (not per component)

3. **Coverage scope (Required E2E Tests)**
   - **Happy path**: User completes intended flow successfully
   - **Validation errors**: Form validation, error messages, edge cases
   - **Loading/empty states**: Loading spinners, empty data, retry logic
   - **Auth boundary**: Login required, redirects, permission checks
   - **Navigation**: All user-accessible routes, breadcrumbs, back button
   - **Accessibility**: Keyboard nav, screen reader, focus management
   - **Mobile**: Responsive on ≤375px viewport (iPhone SE)

4. **No unit tests for UI components**
   - UI component rendering tests are covered by E2E (real render)
   - Don't test component props in isolation (test real user interactions)
   - Exception: Pure utility functions → unit test in `utils.test.ts`
   - If you're writing `render()` + `getByRole()` tests, stop—write E2E instead

5. **Test plan written first**
   - Before writing any test file, write `docs/e2e-plan.md` (what flows to test, acceptance criteria)
   - Plan must cover: happy path, validation, loading, auth, navigation, a11y
   - Share plan with team before implementation
   - Used to verify coverage after tests pass

6. **Setup: app must run + tests configured**
   - Dev server runs on known port (e.g., http://localhost:3006)
   - Playwright configured to point to running app
   - Database seeded with test data (not reset between tests; use transactions)
   - Test user credentials predefined + stable
   - Environment variables in `.env.test`

7. **Async patterns**
   - Always `await` user actions (clicks, types, navigations)
   - Always `await` assertions that wait for elements
   - Use `page.waitForURL()` for navigation confirmation
   - Use `page.waitForSelector()` only if dynamic content loads
   - Use `expect().toBeVisible()` not `.toBeTruthy()` (visibility matters)

8. **Accessibility testing integrated**
   - Every E2E test must support keyboard navigation (not mouse-only)
   - Inject axe-core in critical flows for automated a11y checks
   - Test screen reader announcements (role, label, description)
   - Verify focus management (modals, navigation)
   - Dark mode tested if supported

---

## Test Structure & Patterns

### File Organization

```
front-end/app/
  e2e/
    fixtures/
      users.ts              ← Predefined test users
      products.ts           ← Predefined test data
    auth.spec.ts            ← Login, logout, session tests
    user-profile.spec.ts    ← User settings, profile edit
    product-search.spec.ts  ← Search, filter, sort flows
    checkout.spec.ts        ← Cart, payment, order confirmation
  docs/
    e2e-plan.md             ← Test strategy & coverage
    e2e-review.md           ← Test audit results
  src/
    ... (application code)
```

### Pattern 1: Basic E2E Test Structure

```typescript
// auth.spec.ts
import { test, expect } from '@playwright/test';

// Test fixtures
const testUser = {
  email: 'test@example.com',
  password: 'password123',
};

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('http://localhost:3006/');
  });

  // Happy path: successful login
  test('should log in with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');

    // Fill form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  // Validation error: invalid email
  test('should show error for invalid email', async ({ page }) => {
    await page.click('a[href="/login"]');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', testUser.password);

    // Error appears on blur
    await page.locator('input[name="email"]').blur();
    await expect(page.locator('text=Invalid email format')).toBeVisible();

    // Submit disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  // Edge case: empty password
  test('should require password', async ({ page }) => {
    await page.click('a[href="/login"]');
    await page.fill('input[name="email"]', testUser.email);

    // Skip password, submit
    await page.click('button[type="submit"]');

    // Error shown, still on login page
    await expect(page.locator('text=Password is required')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  // Auth boundary: redirect unauthenticated user
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('http://localhost:3006/dashboard');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  // Logout flow
  test('should log out and redirect to home', async ({ page }) => {
    // First, log in
    await loginUser(page, testUser);

    // Navigate to dashboard
    await page.goto('http://localhost:3006/dashboard');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Click logout
    await page.click('button[aria-label="Logout"]');

    // Confirm redirect to home
    await page.waitForURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});

// Helper function
async function loginUser(page, credentials) {
  await page.goto('http://localhost:3006/login');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

### Pattern 2: Form Validation Tests

```typescript
// user-profile.spec.ts
import { test, expect } from '@playwright/test';

const testUser = {
  email: 'user@example.com',
  password: 'password123',
};

test.describe('User Profile Edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/');
    await loginUser(page, testUser);
    await page.goto('http://localhost:3006/profile/edit');
  });

  // Happy path: valid form submission
  test('should update profile with valid data', async ({ page }) => {
    // Fill form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="phone"]', '+1234567890');

    // Submit
    await page.click('button[type="submit"]');

    // Success feedback
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Verify data persisted (navigate away and back)
    await page.goto('http://localhost:3006/profile');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  // Validation: required field empty
  test('should show error for missing required fields', async ({ page }) => {
    // Clear firstName
    await page.locator('input[name="firstName"]').clear();

    // Tab out (trigger validation)
    await page.locator('input[name="firstName"]').blur();

    // Error shown
    await expect(page.locator('text=First name is required')).toBeVisible();

    // Submit disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  // Validation: phone format
  test('should validate phone format', async ({ page }) => {
    await page.fill('input[name="phone"]', 'invalid-phone');
    await page.locator('input[name="phone"]').blur();

    // Error shown
    await expect(page.locator('text=Invalid phone format')).toBeVisible();
  });

  // Real-time validation feedback
  test('should show validation feedback in real-time', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');

    // Invalid email
    await emailInput.fill('not-email');
    await expect(page.locator('[role="alert"]:has-text("Invalid email")')).toBeVisible();

    // Fix email
    await emailInput.fill('valid@example.com');
    await expect(page.locator('[role="alert"]:has-text("Invalid email")')).not.toBeVisible();
  });

  // Loading state during submission
  test('should show loading state and prevent double submit', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Jane');
    const submitButton = page.locator('button[type="submit"]');

    // Click submit
    await submitButton.click();

    // Button shows loading state
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('Saving...');

    // Wait for success
    await expect(page.locator('text=Profile updated')).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toContainText('Save');
  });

  // Error handling: server error
  test('should handle server errors gracefully', async ({ page }) => {
    // Intercept network and return error
    await page.route('**/api/profile', route =>
      route.abort('failed')
    );

    await page.fill('input[name="firstName"]', 'Test');
    await page.click('button[type="submit"]');

    // Error message shown
    await expect(page.locator('text=Failed to update profile. Please try again.')).toBeVisible();

    // Form still fillable (not locked)
    await expect(page.locator('input[name="firstName"]')).toBeEnabled();
  });
});
```

### Pattern 3: Navigation & Routing Tests

```typescript
// navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/');
  });

  // Navigation via links
  test('should navigate to product page from home', async ({ page }) => {
    await page.click('a[href="/products"]');
    await page.waitForURL('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  // Breadcrumbs work
  test('should navigate back via breadcrumb', async ({ page }) => {
    await page.goto('http://localhost:3006/products/123');
    await page.click('a:has-text("Products")'); // Breadcrumb
    await page.waitForURL('/products');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  // Browser back button
  test('should work with browser back button', async ({ page }) => {
    await page.goto('http://localhost:3006/products');
    await page.click('a[href="/products/123"]');
    await page.waitForURL('/products/123');

    // Go back
    await page.goBack();
    await page.waitForURL('/products');
  });

  // Invalid route shows 404
  test('should show 404 for invalid route', async ({ page }) => {
    await page.goto('http://localhost:3006/nonexistent-page');
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });
});
```

### Pattern 4: Accessibility Tests

```typescript
// accessibility.spec.ts
import { test, expect, injectAxe, checkA11y } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Application Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/');
  });

  // Automated a11y scan
  test('home page should be accessible', async ({ page }) => {
    await injectAxe(page);
    await checkA11y(page);  // Fails if violations found
  });

  // Keyboard navigation: tab through form
  test('should tab through login form', async ({ page }) => {
    await page.click('a[href="/login"]');

    // Tab to email input
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    // Tab to password input
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();

    // Tab to submit button
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();

    // Activate with Enter
    await page.keyboard.press('Enter');
    // Form validates and submits
  });

  // Escape key closes modal
  test('should close modal with Escape key', async ({ page }) => {
    await page.click('button:has-text("Open Dialog")');
    await expect(page.locator('role=dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  // Focus management: modal focus trap
  test('should trap focus in modal', async ({ page }) => {
    await page.click('button:has-text("Open Dialog")');
    const modal = page.locator('role=dialog');

    // Get first and last focusable elements
    const firstButton = modal.locator('button').first();
    const lastButton = modal.locator('button').last();

    // Focus on first button, shift+tab should go to last
    await firstButton.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(lastButton).toBeFocused();

    // Focus on last, tab should go to first
    await lastButton.focus();
    await page.keyboard.press('Tab');
    await expect(firstButton).toBeFocused();
  });

  // Screen reader: form labels
  test('should have proper labels for form inputs', async ({ page }) => {
    await page.click('a[href="/login"]');

    // Check email input has label
    const emailInput = page.locator('input[name="email"]');
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toContainText('Email');

    // Check password input has label
    const passwordInput = page.locator('input[name="password"]');
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toContainText('Password');
  });

  // Landmarks: nav, main, footer
  test('should have semantic landmarks', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();      // Navigation
    await expect(page.locator('main')).toBeVisible();     // Main content
    await expect(page.locator('footer')).toBeVisible();   // Footer
  });

  // Dark mode: contrast maintained
  test('should maintain contrast in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // Run a11y check
    await injectAxe(page);
    await checkA11y(page);  // Fails if contrast insufficient
  });
});
```

### Pattern 5: Mobile Responsiveness Tests

```typescript
// mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

// Run on mobile viewport
test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone SE'] });

  test('should render correctly on mobile', async ({ page }) => {
    await page.goto('http://localhost:3006/');

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);

    // Check touch targets are ≥44px
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });

  // Menu works on mobile
  test('should open mobile menu', async ({ page }) => {
    await page.goto('http://localhost:3006/');

    // Hamburger button visible on mobile
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();

    // Click to open menu
    await hamburger.click();
    await expect(page.locator('nav')).toBeVisible();
  });

  // Tabs work on mobile
  test('should navigate tabs on mobile', async ({ page }) => {
    await page.goto('http://localhost:3006/profile');

    // Tab buttons visible
    const tabs = page.locator('role=tab');
    await expect(tabs).toHaveCount(3);

    // Click tab, content updates
    await tabs.nth(1).click();
    await expect(page.locator('text=Second tab content')).toBeVisible();
  });
});
```

---

## Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3006',
    reuseExistingServer: !process.env.CI,
  },
});
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "vite --port 3006",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## Test Plan Template

Create `front-end/app/docs/e2e-plan.md` before writing tests:

```markdown
# Frontend E2E Test Plan

## Scope
- Application URL: http://localhost:3006
- Test user: test@example.com / password123
- Database: Seeded with sample data before tests

## Flows to Cover

### 1. Authentication Flow
- [ ] Happy path: login with valid credentials → redirect to dashboard
- [ ] Validation: empty email → error
- [ ] Validation: invalid email format → error
- [ ] Validation: empty password → error
- [ ] Edge case: login with spaces → trimmed
- [ ] Auth boundary: unauthenticated user redirected to login
- [ ] Session: logout → redirect to home, session cleared
- [ ] Dark mode: accessibility maintained

### 2. User Profile Management
- [ ] Navigate to profile edit page
- [ ] Update each field (firstName, lastName, email, phone)
- [ ] Submit valid form → success message, data persisted
- [ ] Leave required field empty → validation error
- [ ] Invalid email format → validation error
- [ ] Invalid phone format → validation error
- [ ] Server error during save → error message, form recoverable
- [ ] Loading state: button disabled, spinner shown
- [ ] Keyboard navigation: tab through all fields
- [ ] Mobile: form responsive on 375px

### 3. Product Search & Filter
- [ ] Homepage loads product list
- [ ] Search by product name → filtered results
- [ ] Filter by category → results updated
- [ ] Sort by price (asc/desc) → order verified
- [ ] Pagination: next/previous pages work
- [ ] Empty results: "no products" message shown
- [ ] Loading state while filtering
- [ ] Mobile: filter accessible on small screen

### 4. Checkout Flow
- [ ] Add product to cart → cart count updated
- [ ] Navigate to cart → items listed
- [ ] Update quantity → total recalculated
- [ ] Remove item → removed from cart
- [ ] Apply coupon code → discount shown
- [ ] Proceed to checkout → payment form shown
- [ ] Complete payment → order confirmation
- [ ] Order details saved
- [ ] Mobile: checkout form responsive

## Acceptance Criteria

- All tests pass on Chrome, Firefox, Safari
- Mobile tests pass on iPhone SE (375px)
- All E2E tests keyboard navigable
- Axe-core automated a11y checks pass
- No console errors during tests
- Average test run time < 60 seconds

## Test Data

- Test user: test@example.com / password123
- Sample products: 10 products across 3 categories
- Pre-seeded in database before test suite runs
```

---

## Integration with Frontend Architecture

This skill **complements** (not replaces) existing patterns:

| Layer | How Tested |
|-------|-----------|
| **Components** | E2E via real clicks/inputs (not prop tests) |
| **Hooks** | E2E via state changes in UI |
| **Context** | E2E via global state effects (theme, auth) |
| **Router** | E2E via navigation clicks |
| **API calls** | E2E against real/mocked server |
| **Forms** | E2E with real validation feedback |
| **A11y** | E2E keyboard nav + axe-core scans |

**Nothing breaks**: Components stay the same, hooks unchanged, state management intact. Tests run against the app as a real user would use it.

---

## Test Execution Checklist

Before pushing tests to CI:

- [ ] Test plan written and approved
- [ ] Dev server runs: `npm run dev`
- [ ] Tests run locally: `npm run test:e2e`
- [ ] All tests pass on Chrome, Firefox, Safari
- [ ] Mobile tests pass: iPhone SE (375px)
- [ ] No flaky tests (run 3x, all pass)
- [ ] Screenshot/video captured for failures
- [ ] Axe-core a11y checks pass
- [ ] No hardcoded waits (use waitFor)
- [ ] Keyboard navigation tested for all interactive elements
- [ ] Form validation covers all cases (empty, invalid, edge)
- [ ] Error handling tested (network errors, server errors)
- [ ] Loading states tested (spinners, disabled buttons)
- [ ] Reviewed by team

---

## Debugging & Troubleshooting

### Test fails with "element not found"
```typescript
// ✗ WRONG: No wait, element may not exist yet
await page.click('button[type="submit"]');

// ✓ CORRECT: Wait for element to appear
await page.waitForSelector('button[type="submit"]');
await page.click('button[type="submit"]');

// ✓ BETTER: Use locator with built-in waits
await page.locator('button[type="submit"]').click();
```

### Test is flaky (sometimes passes, sometimes fails)
```typescript
// ✗ WRONG: Hardcoded sleep
await page.waitForTimeout(1000);
await page.click('button');

// ✓ CORRECT: Wait for condition
await page.locator('button').waitFor({ state: 'visible' });
await page.click('button');

// ✓ BETTER: Wait for state change after action
await page.click('button:has-text("Submit")');
await expect(page.locator('text=Success')).toBeVisible();
```

### Debug test interactively
```bash
# Run in debug mode
npm run test:e2e:debug

# Run in headed mode with browser visible
npm run test:e2e:headed

# UI mode: interactive test runner
npm run test:e2e:ui
```

---

## Related Skills

- **frontend-architecture**: Component design, state management, routing
- **frontend-a11y**: Accessibility best practices, keyboard nav, ARIA
- **js-testing**: Backend testing patterns (different approach than E2E)

