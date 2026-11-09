## Problem Definition

**Problem:** Rate limiting logic is currently tied to Express middleware, which blocks reuse across other apps/frameworks.
**User:** Internal package consumers building API and service layers across multiple apps.
**Success:** A framework-agnostic rate limit core is reusable from multiple adapters with optional external store support.

## Requirements

### Functional

- Provide a framework-agnostic consume API for fixed-window rate limiting.
- Support pluggable storage through a simple increment contract.
- Provide in-memory default storage when no store is configured.
- Support multiple bucket scopes (global, org, user, apiKey, route, composite).

### Non-functional

- Performance: O(1) local store operations per request.
- Reliability: deterministic key building and safe defaults for missing identities.
- Security: never require raw API keys in core identity model.

## Architecture

### HLD

- `RateLimitCore` orchestrates key building and store increment.
- `RateLimitStore` is the persistence boundary.
- `InMemoryRateLimitStore` is bundled default implementation.
- External adapters (Express now, others later) map transport requests into core context.

### LLD

- Public API: `RateLimitCore.consume(input: ConsumeInput): Promise<RateLimitOutcome>`
- Key types: `RateLimitPolicy`, `RateLimitRequestContext`, `RateLimitStore`
- Pattern: adapter + strategy (store strategy injected via interface)
- Error handling: throw through from store implementations to adapters

## Phases

### Phase 1 — Foundation

Goal: Scaffold package and define stable public contract.
Deliverables:

- `package.json`, `tsconfig.json`, `src/types.ts`, `src/index.ts`
- initial `README.md`, `docs/plan.md`, `docs/future-roadmap.md`
  Review gate: run code-review, fix [high] + [med] before Phase 2.

### Phase 2 — Core Engine

Goal: Implement key builder, memory store, and consume orchestration.
Deliverables:

- `src/helpers/build-bucket-key.util.ts`
- `src/in-memory-rate-limit-store.ts`
- `src/rate-limit-core.ts`
  Review gate: run code-review, fix [high] + [med] before Phase 3.

### Phase 3 — Validation and Integration

Goal: Add tests and integrate with `@util/api-server` adapter path.
Deliverables:

- `src/rate-limit-core.test.ts`
- adapter usage from `@util/api-server`
  Review gate: run code-review, fix [high] + [med] before finalization.

## Test Plan

- `describe("RateLimitCore")`
  - `it("allows until max and blocks on overflow")`
  - `it("uses distinct buckets for distinct users in user scope")`
- `describe("ApiServer rate-limit integration")`
  - `it("keeps existing global limit behavior by default")`
  - `it("supports custom store injection")`
  - `it("supports route-level custom policy")`

## Planning Discussion

- User requested phase-wise development with all advanced functionality optional.
- User requested framework-agnostic reusable package for multiple apps.
- User requested README guidance for Redis, MongoDB, and custom stores.

## Decision Log

- 2026-03-24 — Chose new package `@util/rate-limit-core` for framework-agnostic reuse across apps.
- 2026-03-24 — Kept default in-memory behavior to preserve backward compatibility.
- 2026-03-24 — Kept external stores behind `RateLimitStore` contract to keep core datastore-agnostic.
