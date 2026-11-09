export { AgentTrace } from "./agent-trace.js";

export {
  estimateTokenCount,
  mergeTokenUsage,
  assertValidTokenUsage,
} from "./helpers/token.util.js";
export {
  flattenAttributes,
  redactAttributes,
  truncateStringAttributes,
} from "./helpers/metadata.util.js";
export {
  scoreStringSimilarity,
  evalKeywordPresence,
  evalJsonSchema,
} from "./helpers/evaluate.util.js";

export type { IAgentTrace, ISpanExporter } from "./interfaces.js";
export type {
  AgentTraceRawConfig,
  AgentTraceConfig,
  ExporterConfig,
  OtlpExporterConfig,
  ConsoleExporterConfig,
  LangSmithExporterConfig,
  SpanAttributes,
  TokenUsage,
  EvalResult,
  ActiveSpan,
  LlmSpanInput,
  ToolSpanInput,
  MemorySpanInput,
  DecisionSpanInput,
  TraceContextHeaders,
} from "./types.js";

export {
  AgentSpanKind,
  ExporterType,
  TOKEN_COUNT_INPUT_KEY,
  TOKEN_COUNT_OUTPUT_KEY,
  TOKEN_COUNT_TOTAL_KEY,
  EVALUATE_SCORE_KEY,
  EVALUATE_LABEL_KEY,
  EVALUATE_COMMENT_KEY,
} from "./constants.js";
