import type { Span } from "@opentelemetry/api";
import { SPAN_KIND_LLM, PROMPT_ATTRIBUTE_MAX_LENGTH } from "../constants.js";
import type { LlmSpanInput } from "../types.js";

const applyLlmAttributes = (span: Span, input: LlmSpanInput): void => {
  span.setAttribute("agenttrace.span.kind", SPAN_KIND_LLM);
  span.setAttribute("gen_ai.request.model", input.model);

  if (input.provider) {
    span.setAttribute("gen_ai.system", input.provider);
  }
  if (input.temperature !== undefined) {
    span.setAttribute("gen_ai.request.temperature", input.temperature);
  }
  if (input.maxTokens !== undefined) {
    span.setAttribute("gen_ai.request.max_tokens", input.maxTokens);
  }
  if (input.prompt) {
    span.setAttribute(
      "gen_ai.prompt",
      input.prompt.length > PROMPT_ATTRIBUTE_MAX_LENGTH
        ? input.prompt.slice(0, PROMPT_ATTRIBUTE_MAX_LENGTH)
        : input.prompt
    );
  }
  if (input.systemPrompt) {
    span.setAttribute(
      "gen_ai.system_prompt",
      input.systemPrompt.length > PROMPT_ATTRIBUTE_MAX_LENGTH
        ? input.systemPrompt.slice(0, PROMPT_ATTRIBUTE_MAX_LENGTH)
        : input.systemPrompt
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

export { applyLlmAttributes };
