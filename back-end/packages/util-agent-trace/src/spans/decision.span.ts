import type { Span } from "@opentelemetry/api";
import { SPAN_KIND_DECISION } from "../constants.js";
import type { DecisionSpanInput } from "../types.js";

const applyDecisionAttributes = (
  span: Span,
  input: DecisionSpanInput
): void => {
  span.setAttribute("agenttrace.span.kind", SPAN_KIND_DECISION);
  span.setAttribute("agenttrace.decision.step", input.step);

  if (input.rationale) {
    span.setAttribute("agenttrace.decision.rationale", input.rationale);
  }
  if (input.options && input.options.length > 0) {
    span.setAttribute(
      "agenttrace.decision.options",
      JSON.stringify(input.options)
    );
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

export { applyDecisionAttributes };
