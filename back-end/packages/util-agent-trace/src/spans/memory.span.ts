import type { Span } from "@opentelemetry/api";
import { SPAN_KIND_MEMORY } from "../constants.js";
import type { MemorySpanInput } from "../types.js";

const applyMemoryAttributes = (span: Span, input: MemorySpanInput): void => {
  span.setAttribute("agenttrace.span.kind", SPAN_KIND_MEMORY);
  span.setAttribute("agenttrace.memory.operation", input.operation);

  if (input.memoryKey) {
    span.setAttribute("agenttrace.memory.key", input.memoryKey);
  }
  if (input.agentId) {
    span.setAttribute("agenttrace.memory.agent_id", input.agentId);
  }

  if (input.attributes) {
    for (const [k, v] of Object.entries(input.attributes)) {
      if (Array.isArray(v)) {
        span.setAttribute(k, v);
      } else {
        span.setAttribute(k, v);
      }
    }
  }
};

export { applyMemoryAttributes };
