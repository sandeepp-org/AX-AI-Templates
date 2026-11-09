---
name: util-agentic-memory
description: Agent long-term memory package with MongoDB default adapter, pluggable storage, retrieval ranking, and tool-call integration.
metadata:
  version: "0.1.0"
  path: packages/util-agentic-memory
---

# @util/agentic-memory

Reusable memory layer for agent frameworks with default Mongo persistence and adapter extensibility.

For full API usage and examples, see [README.md](./README.md).

## Rules

- **Singletons:** `AgenticMemory` is a singleton per process. `@util/mongodb` is also a singleton; a second `AgenticMemory.create` with a different `uri` or `database` throws `MongoMemorySingletonConflictError` instead of overwriting the connection.
- **Closing:** Default Mongo adapter does **not** disconnect on `close()` unless `mongo.closeConnectionOnClose` is true, so shared Mongo usage in the app stays safe. If you pass `mongo: { mongoDb }`, the adapter never closes that instance.
- **Trust `agentId`:** Callers must bind `agentId` from authenticated context; the library does not verify identity.
- **Tool validation:** Invalid tool payloads throw `MemoryToolValidationError` (wraps `ZodError`), not raw Zod exceptions.
