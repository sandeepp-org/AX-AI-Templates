# @util/agentic-memory — Future Roadmap

## Near-term

- Add optional `SqliteMemoryStoreAdapter` for low-dependency local use.
- Add richer retrieval controls (weights, minimum score threshold, pagination).
- Add optional text index configuration strategy for large `searchText` corpora.

## Memory evolution roadmap

1. Procedural memory (V1) — `rule`, `preference` hardening and policy helpers.
2. Semantic memory (V1.x) — improved `fact` retrieval quality and ranking.
3. Episodic memory (V1.x) — richer `context` event history patterns.

## Operational roadmap

- Optional read-through cache adapter (Redis).
- Optional scheduled maintenance API for deterministic cleanup.
- Optional observability module for OpenTelemetry metrics/traces.

## Adapter roadmap

- PostgreSQL adapter.
- Redis-optimized adapter for short-lived high-throughput memory.
- Vector-augmented semantic recall adapter (optional V2).
