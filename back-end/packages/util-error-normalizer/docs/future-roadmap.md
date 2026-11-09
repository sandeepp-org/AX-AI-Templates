## Future Roadmap — @util/errors

- **Error taxonomy and helpers**
  - Expand the core error code set for more domains (auth, payments, messaging).
  - Add generator utilities to create app-specific error families with minimal boilerplate.
  - Provide mapping helpers to convert `NormalizedError` into HTTP, gRPC, and message-queue responses.

- **Integration with other packages**
  - Tighten integration with `@util/api-server` for richer default HTTP mappings and error pages.
  - Add conventions and helpers for passing `NormalizedError` into `@util/logger` with redaction rules.

<!-- optional -->

- **Tooling and DX**
  - CLI to scan code for thrown errors and list all used error codes.
  - Documentation generator that builds error catalogs from code (tables of codes, messages, statuses).

- **Runtime features**
  - Optional error sampling and throttling to avoid log storms.
  - Hooks to attach correlation IDs and user/session context consistently.
