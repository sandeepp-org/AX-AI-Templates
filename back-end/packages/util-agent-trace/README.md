# @util/agent-trace

Lightweight, framework-agnostic observability SDK for LLM agents. Wraps OpenTelemetry's Node.js SDK behind a typed `AgentTrace` class with four semantic span types, pluggable exporters, and optional LangSmith sync.

## Installation

```bash
pnpm add @util/agent-trace
# Optional: for LangSmith sync
pnpm add langsmith
```

## Quick Start

```typescript
import { AgentTrace } from "@util/agent-trace";

const tracer = new AgentTrace({
  serviceName: "my-agent",
  exporters: [
    { type: "otlp", endpoint: "http://otel-collector:4318/v1/traces" },
  ],
});

// LLM call span
const llmSpan = tracer.startLlmSpan("invoke-llm", {
  model: "claude-sonnet-4-6",
  provider: "anthropic",
  prompt: "Explain observability",
});
llmSpan.setTokenUsage({ inputTokens: 50, outputTokens: 120, totalTokens: 170 });
llmSpan.end();

// Tool span (child of LLM span)
const parent = tracer.startDecisionSpan("route", { step: "choose-action" });
const toolSpan = tracer.startToolSpan(
  "web-search",
  { toolName: "search", toolInput: { q: "otel" } },
  parent
);
toolSpan.end();
parent.end();

await tracer.shutdown();
```

## Configuration

| Field               | Type                                          | Default              | Description                                                 |
| ------------------- | --------------------------------------------- | -------------------- | ----------------------------------------------------------- |
| `serviceName`       | `string`                                      | `"agent-trace"`      | OTel `service.name` resource attribute                      |
| `exporters`         | `ExporterConfig[]`                            | `[{ type: "otlp" }]` | List of span exporters                                      |
| `langsmithApiKey`   | `string`                                      | —                    | Activates LangSmith exporter (requires `langsmith` package) |
| `langsmithProject`  | `string`                                      | —                    | LangSmith project name                                      |
| `defaultAttributes` | `Record<string, string \| number \| boolean>` | `{}`                 | Attributes added to every span                              |

### Exporter Config

**OTLP (default)**

```typescript
{ type: "otlp", endpoint?: string, headers?: Record<string, string> }
// default endpoint: http://localhost:4318/v1/traces
```

**Console (dev)**

```typescript
{
  type: "console";
}
```

**LangSmith (optional)**

```typescript
{ type: "langsmith", apiKey: string, project?: string }
// Or use top-level langsmithApiKey convenience field
```

## Span Types

### LLM Span

```typescript
const span = tracer.startLlmSpan("call-name", {
  model: "gpt-4o",
  provider: "openai",       // optional
  prompt: "...",            // optional, truncated at 8KB
  systemPrompt: "...",      // optional
  temperature: 0.7,         // optional
  maxTokens: 1024,          // optional
  attributes: { ... },      // optional custom attributes
});
```

OTel attributes set: `gen_ai.request.model`, `gen_ai.system`, `gen_ai.request.temperature`, `gen_ai.request.max_tokens`, `gen_ai.prompt`, `gen_ai.system_prompt`, `agenttrace.span.kind = "llm"`

### Tool Span

```typescript
const span = tracer.startToolSpan("tool-name", {
  toolName: "web_search",
  toolInput: { query: "..." }, // optional, JSON-serialized, truncated at 4KB
});
```

### Memory Span

```typescript
const span = tracer.startMemorySpan("mem-op", {
  operation: "read" | "write" | "delete" | "search",
  memoryKey: "session-123", // optional
  agentId: "agent-abc", // optional
});
```

### Decision Span

```typescript
const span = tracer.startDecisionSpan("decide", {
  step: "choose-tool",
  rationale: "User asked factual question", // optional
  options: ["search", "memory", "direct"], // optional
});
```

## ActiveSpan API

Every `startXxxSpan` call returns an `ActiveSpan`:

```typescript
span.addAttribute("custom.key", "value");
span.addEvent("token.received", { count: 10 });
span.setTokenUsage({ inputTokens: 50, outputTokens: 120, totalTokens: 170 });
span.setEvalResult({ score: 0.95, label: "pass", comment: "Correct answer" });
span.end(); // success
span.end(new Error("failed")); // records exception + sets ERROR status
```

## Context Propagation

```typescript
// Inject W3C traceparent into outgoing headers
const headers = tracer.injectContext(
  { "content-type": "application/json" },
  parentSpan
);
// → { "content-type": "...", "traceparent": "00-traceId-spanId-01" }

// Extract from incoming headers (e.g. in a downstream service)
const ctx = tracer.extractContext(incomingHeaders);
// → { traceId: "...", spanId: "..." } or undefined
```

## Utility Helpers

### Token Utilities

```typescript
import {
  estimateTokenCount,
  mergeTokenUsage,
  assertValidTokenUsage,
} from "@util/agent-trace";

estimateTokenCount("Hello world"); // → ~2
mergeTokenUsage({ inputTokens: 10 }, { outputTokens: 20 }); // → { ..., totalTokens: 30 }
assertValidTokenUsage({ inputTokens: -1 }); // throws RangeError
```

### Metadata Utilities

```typescript
import {
  flattenAttributes,
  redactAttributes,
  truncateStringAttributes,
} from "@util/agent-trace";

flattenAttributes({ user: { id: "123" } }); // → { "user.id": "123" }
redactAttributes(attrs, ["apiKey", /^auth\./]); // → replaces with "[Redacted]"
truncateStringAttributes(attrs, 512); // → truncates string values to 512 chars
```

### Evaluation Utilities

```typescript
import {
  scoreStringSimilarity,
  evalKeywordPresence,
  evalJsonSchema,
} from "@util/agent-trace";
import { z } from "zod";

scoreStringSimilarity("hello world", "hello earth"); // → ~0.7
evalKeywordPresence("The quick fox", ["quick", "slow"]); // → { score: 0.5, label: "fail", ... }
evalJsonSchema(jsonString, z.object({ name: z.string() })); // → { score: 1, label: "pass" }
```

## Shutdown

Always await `tracer.shutdown()` before process exit to flush pending OTLP batches:

```typescript
process.on("SIGTERM", async () => {
  await tracer.shutdown();
  process.exit(0);
});
```
