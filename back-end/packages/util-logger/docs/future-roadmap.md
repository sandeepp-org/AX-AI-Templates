## Future Roadmap — @util/logger

- **More transports**
  - Add HTTP/webhook transport for pushing logs to external services.
  - File transport implemented.

- **Advanced formatting and redaction**
  - Per-transport redaction rules (fields, paths, and patterns).
  - Human-friendly console presets for local dev (colors, pretty-print).

- **Operational features**
  - Health/diagnostics API to expose current levels and transport status.
  - Dynamic log-level updates at runtime (e.g. from env, API, or config file).

- **Ecosystem integrations**
  - Helper adapters for popular frameworks (Express, Nest, Fastify) using `@util/logger` as the engine.
  - Preset configs for common environments (local, staging, production).
