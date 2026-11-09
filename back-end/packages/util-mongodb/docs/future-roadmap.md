## Future Roadmap — @util/mongodb

- **Schema and validation**
  - Add reusable schema registry so collections can register Zod schemas once.
  - Built-in helpers for common patterns (pagination, sorting, projections).
  - Optional JSON Schema export from Zod schemas for tooling integration.
  - Transaction support.

- **Performance and operations**
  - Connection pool metrics (open connections, in-use, wait times).
  - Query logging with slow-query thresholds and sampling.
  - Automatic index suggestions based on observed query patterns (opt-in).

- **Features and APIs**
  - Bulk operations helpers for batched writes with transactional semantics when available.
  - Change-stream helpers for listening to collection changes.
  - Migration utilities for schema evolution and backfills.

- **Resilience**
  - Retry strategies for transient network errors with backoff.
  - Pluggable error classification to integrate with `@util/errors`.
