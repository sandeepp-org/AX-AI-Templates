import type { Span } from "@opentelemetry/api";
import {
  SPAN_KIND_TOOL,
  TOOL_INPUT_ATTRIBUTE_MAX_LENGTH,
} from "../constants.js";
import type { ToolSpanInput } from "../types.js";

const applyToolAttributes = (span: Span, input: ToolSpanInput): void => {
  span.setAttribute("agenttrace.span.kind", SPAN_KIND_TOOL);
  span.setAttribute("agenttrace.tool.name", input.toolName);

  if (input.toolInput !== undefined) {
    const serialized = JSON.stringify(input.toolInput);
    span.setAttribute(
      "agenttrace.tool.input",
      serialized.length > TOOL_INPUT_ATTRIBUTE_MAX_LENGTH
        ? serialized.slice(0, TOOL_INPUT_ATTRIBUTE_MAX_LENGTH)
        : serialized
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

export { applyToolAttributes };
