## Future Roadmap — @util/api-server

- **Routing and protocol support**
  - Add support for non-POST methods (GET, PUT, DELETE, PATCH) while keeping the `{ data, error }` envelope. (Done)
  - Optional versioned routing (e.g. `/api/v1`, `/api/v2`) with per-version config. (Done)
  - Server-Sent Events (SSE) integration for real-time endpoints. (Done)

- **OpenAPI and docs**
  - Pluggable OpenAPI generator with extension points for custom schema mappers.
  - CLI to export OpenAPI spec and generate typed API clients.
  - Built-in Swagger theme presets and dark-mode support.

- **Security and resilience**
  - Redis-backed shared store for rate limiting (consistent enforcement across multiple instances). (Done, optional via pluggable store adapter)
  - Rate-limit buckets per route and per API key. (Done, optional per-route policy + scope resolver)
  - Circuit-breaker and retry helpers for downstream dependencies.

- **Observability and operations**
  - First-class metrics (Prometheus) for requests, latencies, and error rates.
  - Structured access logs compatible with common log aggregation tools.
  - Graceful zero-downtime reload hooks for container orchestrators.
