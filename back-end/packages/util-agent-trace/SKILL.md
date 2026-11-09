---
name: util-agent-trace
description: Lightweight observability SDK for LLM agents — OpenTelemetry spans, OTLP/LangSmith export, token tracking, eval utilities.
metadata:
  version: "0.1.0"
  path: packages/util-agent-trace
---

# util-agent-trace Vendoring Guide

## What This Package Does

`@util/agent-trace` is a framework-agnostic observability SDK for LLM agent workflows. It wraps the OpenTelemetry Node.js SDK behind an `AgentTrace` class and optionally syncs runs to LangSmith.

## Key Rules

- **Multiple instances** — `AgentTrace` is instance-based (not singleton). Each instance owns its own `NodeTracerProvider`. Never use a global singleton.
- **Shutdown is mandatory** — call `await tracer.shutdown()` before process exit to flush pending OTLP spans.
- **LangSmith is optional** — only constructed when `langsmithApiKey` is present. No API calls otherwise.
- **Config is validated at construction** — invalid config throws a `ZodError` synchronously.
- **No env loading in package** — pass config in from the app at bootstrap.

## Quick Integration

```typescript
import { AgentTrace } from "@util/agent-trace";

const tracer = new AgentTrace({
  serviceName: "my-agent",
  exporters: [
    { type: "otlp", endpoint: "http://otel-collector:4318/v1/traces" },
  ],
});

const span = tracer.startLlmSpan("invoke-claude", {
  model: "claude-sonnet-4-6",
  provider: "anthropic",
  prompt: userMessage,
});

// ... call LLM ...

span.setTokenUsage({ inputTokens: 120, outputTokens: 240, totalTokens: 360 });
span.end();

await tracer.shutdown();
```

## Files Modified When Adding This Package

- `packages/util-agent-trace/` (this package)
- Root `tsconfig.json` — add `{ "path": "packages/util-agent-trace" }` to `references`
- Root `jest.config.cjs` — add `"^@util/agent-trace$"` to `moduleNameMapper`
