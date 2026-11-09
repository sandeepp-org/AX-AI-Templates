# util-agent-trace — Design Plan

## Problem Definition

No observability infrastructure exists in the Nexus monorepo for LLM agent workflows. Developers have no standardized way to trace LLM calls, tool invocations, memory operations, or agent decision steps, making it hard to debug failures, optimize performance, or evaluate output quality in production.

## Requirements

### Functional

- Instance-based `AgentTrace` class; multiple instances may coexist in a process
- Four semantic span types: LLM, tool, memory, decision — each with typed input shapes
- Pluggable exporters: OTLP/HTTP (primary), console (dev), LangSmith (optional)
- W3C TraceContext propagation — inject and extract from HTTP headers
- Token usage tracking attached to spans
- Eval result attachment (score, label, comment)
- Utility helpers: token estimation, attribute flattening/redaction/truncation, string similarity and JSON schema evaluation

### Non-functional

- Zero side effects on import — OTel SDK initialized only in constructor
- No global tracer registration (`provider.register()` not called)
- LangSmith is optional peer dependency; graceful error when not installed
- No env var loading in package — config passed from app
- All config validated via Zod with clear error messages

## Architecture

### High-Level

```
App / Agent
    │
    ▼
AgentTrace (instance)
    │
    ├─ NodeTracerProvider (per instance)
    │       │
    │       ├─ BatchSpanProcessor → OTLPTraceExporter → OTLP backend
    │       ├─ SimpleSpanProcessor → ConsoleSpanExporter → stdout
    │       └─ BatchSpanProcessor → LangSmithSpanExporter → LangSmith API
    │
    └─ W3CTraceContextPropagator (per instance)
```

### Key Files

| File                              | Role                                              |
| --------------------------------- | ------------------------------------------------- |
| `agent-trace.ts`                  | Primary class — wires provider, processors, spans |
| `config.ts`                       | Zod normalization of raw config                   |
| `exporters/otlp.exporter.ts`      | Factory wrapping `OTLPTraceExporter`              |
| `exporters/console.exporter.ts`   | Human-readable stdout exporter                    |
| `exporters/langsmith.exporter.ts` | OTel → LangSmith `RunCreate` mapper               |
| `spans/*.span.ts`                 | Per-span-type OTel attribute application          |
| `helpers/token.util.ts`           | Token estimation, merging, validation             |
| `helpers/metadata.util.ts`        | Flatten, redact, truncate span attributes         |
| `helpers/evaluate.util.ts`        | String similarity, keyword, JSON schema eval      |

## Phases

1. **Foundation** — types, interfaces, config, constants, index
2. **Exporters** — OTLP, console, LangSmith
3. **Span helpers** — llm, tool, memory, decision attribute appliers
4. **Core class** — AgentTrace with provider wiring and lifecycle
5. **Utility helpers** — token, metadata, evaluate
6. **Tests** — co-located, zero mocks, real OTel execution
7. **Docs** — README, SKILL.md, this file

## Test Plan

- `agent-trace.test.ts` — constructor variants, all span types, parent-child linking, context propagation, shutdown, LangSmith config
- `token.util.test.ts` — estimateTokenCount, mergeTokenUsage, assertValidTokenUsage edge cases
- `metadata.util.test.ts` — flattenAttributes nesting, redactAttributes string/regex, truncateStringAttributes defaults
- `evaluate.util.test.ts` — scoreStringSimilarity identical/different/partial, evalKeywordPresence pass/fail/partial, evalJsonSchema valid/invalid/wrong-type

Tests use console exporter (no network). Parent-child tracing verified via matching `traceId`.

## Decision Log

| Decision                              | Rationale                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Instance-based (not singleton)        | Multiple services/tests may coexist; singleton would cause cross-contamination        |
| No `provider.register()`              | Avoids mutating global tracer; keeps each instance self-contained                     |
| LangSmith via dynamic import          | Optional peer dep — clear error if not installed, no import-time side effects         |
| GenAI semantic conventions            | OTLP backends auto-detect `gen_ai.*` attribute namespace                              |
| BatchSpanProcessor for OTLP/LangSmith | Buffers spans for efficiency; SimpleSpanProcessor for console only (immediate output) |
