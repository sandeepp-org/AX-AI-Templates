# util-agent-trace — Future Roadmap

## Planned Features

### Streaming Span Support

Accumulate token counts and events across streaming LLM response chunks. Each chunk appends an event to the open span; `end()` is called when the stream closes.

### gRPC OTLP Exporter

Add `@opentelemetry/exporter-trace-otlp-grpc` as an optional exporter config type for high-throughput deployments.

### Trace Sampling Configuration

Support `AlwaysOnSampler`, `AlwaysOffSampler`, and `TraceIdRatioBased` via config to reduce cardinality in production.

### Provider-Specific Attribute Mappers

Auto-detect LLM provider from model name prefix (e.g. `claude-*` → Anthropic, `gpt-*` → OpenAI) and apply provider-specific semantic attributes automatically.

### Auto-Instrumentation for `@util/agentic-memory`

Optional opt-in integration: when `@util/agentic-memory` detects an `AgentTrace` instance in its config, wrap each `saveMemory`/`retrieveMemory`/`deleteMemory` call in a memory span automatically.

### Semantic Similarity Evaluator

Add `evalSemanticSimilarity(output, reference, embeddingFn)` to `evaluate.util.ts` — caller provides an embedding function; similarity is cosine distance between embeddings.

### Jaeger / Zipkin Exporter Support

Add factory helpers for `@opentelemetry/exporter-jaeger` and `@opentelemetry/exporter-zipkin`.

### Span Attribute Schema Enforcement

Optional Zod schema for span attributes — validate at `addAttribute` call time in dev mode, no-op in production.

### OpenTelemetry Baggage Propagation

Propagate W3C Baggage alongside TraceContext headers for passing agent metadata (e.g. `agentId`, `sessionId`) across service boundaries without span attribute pollution.
