# util-agent-trace — Code Review

## Open Findings

_None at initial release._

## Completed / Resolved

_N/A — initial implementation._

## Notes

- LangSmith exporter uses async `static create()` pattern because `import("langsmith")` is async. The exporter is registered with the provider after construction completes. Spans started immediately after `new AgentTrace()` with `langsmithApiKey` may be missed if the LangSmith exporter hasn't resolved yet — this is an acceptable trade-off for a dev/analytics exporter (not a critical path).
- `contextFromActiveSpan` creates a minimal `Span` stub. A cleaner approach would be to store the original OTel `Span` reference inside `ActiveSpan`, but this would expose internal OTel types in the public API. Current design keeps `ActiveSpan` a plain object type.
