---
name: js-testing
description: "Enforces zero-mocking, real-execution testing strategy for MEAN/MERN and full-stack JavaScript/TypeScript projects. Backend: real DB, no mocks, co-located *.test.ts. Frontend: Playwright end-to-end against a running app, no component mocking. Use when generating, reviewing, or refactoring any JavaScript or TypeScript test."
metadata:
  version: "1.1"
---

# Testing Strategy for JavaScript / TypeScript Projects

These rules apply to all MEAN, MERN, and full-stack JavaScript/TypeScript test suites — both backend (Node services, packages) and frontend (web apps, UI flows).

## Surface routing

| Surface                          | Tool          | Where                                    |
| -------------------------------- | ------------- | ---------------------------------------- |
| Backend (services, packages)     | Jest / Vitest | Co-located `*.test.ts` next to source    |
| Frontend (UI flows, page logic)  | Playwright    | `app/tests/e2e/*.spec.ts` (or per-app)   |

Backend rules below (Zero Mocking, Real Execution, …) apply to **both** surfaces. Frontend adds the Playwright section near the bottom of this file.

## Zero Mocking

Do **not** use mocks, stubs, spies, or any test doubles.

**Forbidden patterns:**

```typescript
// All of these are disallowed
jest.mock("./user.service");
jest.spyOn(service, "findUser");
sinon.stub(db, "query");
vi.mock("../lib/mailer");
sandbox.stub(axios, "get");
```

If a test feels like it needs a mock, that usually means the code under test should be refactored, or the test should be written as a broader integration test that exercises the real dependency.

## Real Execution

Every test must call the **actual implementation** of the function and all its dependencies. No fake or in-memory replacements for databases, caches, queues, or external services that are under your control.

**Wrong:**

```typescript
const mockRepo = { findById: () => Promise.resolve(fakeUser) };
const service = new UserService(mockRepo);
const result = await service.getUser("123");
```

**Right:**

```typescript
const service = new UserService(userRepository);
const result = await service.getUser(testUserId);
```

The test environment must be configured so that the real dependencies (database, cache, etc.) are available — typically a dedicated test database seeded with known data.

## Treat Unit Tests as Functional Integration Tests

Since tests run against a **dedicated database** and **target configuration**:

- Side effects (creating, updating, deleting records) are permitted.
- Tests should set up their own preconditions and clean up when appropriate.
- Test ordering should not matter — each test should be independently runnable.

**Example — testing a service that writes to the database:**

```typescript
describe("OrderService", () => {
  let orderId: string;

  beforeAll(async () => {
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should create an order", async () => {
    const order = await orderService.createOrder(validOrderPayload);
    orderId = order.id;
    expect(order.status).toBe("pending");
  });

  it("should retrieve the created order", async () => {
    const order = await orderService.getOrderById(orderId);
    expect(order).toBeDefined();
    expect(order.id).toBe(orderId);
  });
});
```

## Test File Conventions

- Place test files **co-located** with the source file — same directory, adjacent to the module under test.
- Name test files `<source-file-name>.test.ts` or `<source-file-name>.spec.ts` (kebab-case, matching the naming conventions skill).
- One test file per source module.

**Example:**

```
services/
  user.service.ts
  user.service.test.ts
  order.service.ts
  order.service.test.ts
```

## Assertions

- Prefer explicit assertions over snapshot tests.
- Assert on specific properties rather than entire objects when possible.
- Use descriptive test names that state the expected behaviour.

**Wrong:**

```typescript
it("works", async () => {
  const result = await doSomething();
  expect(result).toMatchSnapshot();
});
```

**Right:**

```typescript
it("should return the user email when given a valid user id", async () => {
  const result = await getUserById(testUserId);
  expect(result.email).toBe("alice@example.com");
});
```

## Input and Output Variables

When a test compares input (what you pass in) with output (what you assert on), use a single variable for both. This avoids duplication, typos, and drift between the two.

**Wrong:**

```typescript
it("should write logs to MongoDB", async () => {
  logger.info("logger mongo test message");
  await logger.close();
  const docs = await collection.find({}).toArray();
  const msgDoc = docs.find((d) => d.msg === "logger mongo test message");
  expect(msgDoc).toBeDefined();
});
```

**Right:**

```typescript
it("should write logs to MongoDB", async () => {
  const msg = "logger mongo test message";
  logger.info(msg);
  await logger.close();
  const docs = await collection.find({}).toArray();
  const msgDoc = docs.find((d) => d.msg === msg);
  expect(msgDoc).toBeDefined();
});
```

## Test Coverage Categories

Every package or module must cover all relevant categories below. Before writing any test, plan which categories apply and list the specific cases.

### Happy path

The normal, successful flow. Cover the most common real-world usage.

```typescript
it("should create a logger with console transport and log a message", async () => { ... });
it("should insert a document and return the inserted id", async () => { ... });
```

### Edge cases and error paths

Boundary conditions, invalid inputs, missing config, and failure scenarios.

```typescript
it("should throw if getInstance() is called before create()", () => { ... });
it("should reject with a typed error when the DB connection is unreachable", async () => { ... });
it("should handle an empty string input without throwing", async () => { ... });
```

### Singleton / lifecycle

For packages that use the singleton + factory pattern, test the full lifecycle:

- `create()` initializes and stores the instance
- `getInstance()` returns the same instance
- `getInstance()` throws before `create()` is called
- `close()` flushes, cleans up, and clears the singleton
- `create()` can be called again after `close()` to reinitialize

```typescript
it("should return the same instance on repeated getInstance() calls", () => { ... });
it("should clear the singleton after close()", async () => { ... });
it("should reinitialize cleanly after close() + create()", async () => { ... });
```

### Per-transport / per-feature

If the package has multiple transports, adapters, or modes, **each one must have its own describe block** with at minimum a happy path and one error case.

```typescript
describe("console transport", () => {
  it("should log to stdout", () => { ... });
});

describe("MongoDB transport", () => {
  it("should write a log entry to the collection", async () => { ... });
  it("should reconnect after a dropped connection", async () => { ... });
});
```

### Per-function / per-method

Each public method or exported function gets its own `it` block — do not bundle multiple method calls into one test.

```typescript
// Wrong: one test covering create + log + close
it("should work end to end", async () => { ... });

// Right: each behaviour tested independently
it("should create with default level 'info'", async () => { ... });
it("should log at the specified level", async () => { ... });
it("should flush pending writes on close()", async () => { ... });
```

### Deep function-level matrix

For each public function/method and key helper function, write both:

- one **happy-path** test (valid input, expected output)
- one **issue-path** test (invalid input, boundary case, or dependency failure)

If happy path requires external infra (AWS, Redis, DB), keep it as an opt-in integration test guarded by env vars instead of skipping coverage entirely.

### Child / scoped instances

If the package supports scoped children (child loggers, request-scoped clients), test that:

- The child inherits parent config
- The child adds its own bindings without modifying the parent
- The parent's lifecycle does not break child usage

```typescript
it("should create a child logger that inherits parent transports", async () => { ... });
it("should not affect parent bindings when child bindings are added", () => { ... });
```

---

## Coverage expectations (backend)

Each package's tests must cover, at minimum:

- **Lifecycle** — `create()` valid input → instance; `getInstance()` before `create()` → throws; `getInstance()` after `create()` → same instance; `close()` cleans up + clears singleton; `create()` after `close()` → reinitializes
- **Per feature / transport / adapter** — happy path + edge cases for each public surface
- **Per error path** — invalid input, missing config, connection failure, etc. → expected error
- **Child / scoped instances** (if applicable) — child inherits parent config; child bindings do not leak to parent

---

## Frontend tests — Playwright (mandatory for UI)

Frontend behaviour is verified with **Playwright end-to-end tests against a real running app**. JSDOM-only unit tests, component-level mocks of routers/stores/HTTP clients, and snapshot-only "renders without crashing" tests do **not** count as coverage for a frontend feature.

### Rules

- Tests run against the actual built or dev-served app (real Node server, real API, real database). The same zero-mocking rule from the backend applies — the API is not stubbed; Playwright drives the real network stack.
- Spec files live under `app/tests/e2e/` (or the per-app equivalent) and are named `<feature>.spec.ts`.
- One spec per user-facing flow. Inside a spec, one `test(...)` per outcome (happy path, validation error, empty state, auth-required redirect, etc.).
- Selectors: prefer `getByRole`, `getByLabel`, `getByTestId`. Do **not** select by CSS class, tag chains, or text that is likely to change.
- Set up and clean up data through the same APIs the user would hit (HTTP, or a dedicated test seed endpoint) — never reach into the DB from the spec, and never share mutable state across specs.
- Each test must be independently runnable; do not rely on the order of `test(...)` blocks.
- Visual / screenshot assertions are allowed only for stable layout regions and only alongside an explicit DOM assertion.

### Required coverage per UI feature

Every page or flow shipped must have Playwright coverage for, at minimum:

- **Happy path** — user completes the flow end-to-end and lands on the success state.
- **Validation / form errors** — required field empty, invalid value, server-side rejection rendered to the user.
- **Loading and empty states** — spinner shown while fetching, empty placeholder rendered when no data.
- **Auth boundary** — unauthenticated user is redirected; authorised user passes through.
- **Navigation / back-button** — deep links and the browser back button leave the app in a sane state.

### Example

```typescript
import { test, expect } from "@playwright/test";

test.describe("user signup", () => {
  test("creates an account and lands on the dashboard", async ({ page }) => {
    const email = `user-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery-staple");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("shows a validation error for an invalid email", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert")).toContainText("valid email");
  });
});
```

---

## Summary Checklist

| Rule          | Key point                                                                        |
| ------------- | -------------------------------------------------------------------------------- |
| Mocking       | Never use mocks, stubs, or spies — backend or frontend                           |
| Execution     | Always call real implementations against real dependencies                       |
| Backend tool  | Jest or Vitest, co-located `*.test.ts`                                           |
| Frontend tool | Playwright, `app/tests/e2e/*.spec.ts` against a running app                      |
| Side effects  | Permitted — tests run against a dedicated test environment                       |
| Isolation     | Each test must be independently runnable                                         |
| Assertions    | Explicit, property-level checks — no snapshots                                   |
| Input/output  | Use a single variable when comparing input vs output                             |
| Happy path    | Always covered                                                                   |
| Edge cases    | Always covered — invalid input, missing config, error paths                      |
| Singleton     | Full lifecycle covered (create, get, close, reinit)                              |
| Per-feature   | Each transport/adapter/mode has its own describe block                           |
| Per-method    | Each public method has its own it block                                          |
| Child/scoped  | Covered if the package supports child instances                                  |
| UI flows      | Happy + validation + loading/empty + auth + navigation covered via Playwright    |
| UI selectors  | Use role/label/testid; never CSS-class or fragile text selectors                 |
