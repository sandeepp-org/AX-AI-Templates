const AGENT_TRACE_SERVICE_NAME_DEFAULT = "agent-trace";
const OTLP_ENDPOINT_DEFAULT = "http://localhost:4318/v1/traces";
const OTEL_SCOPE_NAME = "@util/agent-trace";
const OTEL_SCOPE_VERSION = "0.1.0";

const SPAN_KIND_LLM = "llm";
const SPAN_KIND_TOOL = "tool";
const SPAN_KIND_MEMORY = "memory";
const SPAN_KIND_DECISION = "decision";

const LANGSMITH_RUN_TYPE_LLM = "llm";
const LANGSMITH_RUN_TYPE_CHAIN = "chain";
const LANGSMITH_RUN_TYPE_TOOL = "tool";

const TOKEN_COUNT_INPUT_KEY = "agenttrace.token.input";
const TOKEN_COUNT_OUTPUT_KEY = "agenttrace.token.output";
const TOKEN_COUNT_TOTAL_KEY = "agenttrace.token.total";

const EVALUATE_SCORE_KEY = "agenttrace.eval.score";
const EVALUATE_LABEL_KEY = "agenttrace.eval.label";
const EVALUATE_COMMENT_KEY = "agenttrace.eval.comment";

const STRING_ATTRIBUTE_MAX_LENGTH = 1024;
const PROMPT_ATTRIBUTE_MAX_LENGTH = 8192;
const TOOL_INPUT_ATTRIBUTE_MAX_LENGTH = 4096;

const ExporterType = {
  OTLP: "otlp",
  CONSOLE: "console",
  LANGSMITH: "langsmith",
} as const;

const AgentSpanKind = {
  LLM: "llm",
  TOOL: "tool",
  MEMORY: "memory",
  DECISION: "decision",
} as const;

export {
  AGENT_TRACE_SERVICE_NAME_DEFAULT,
  OTLP_ENDPOINT_DEFAULT,
  OTEL_SCOPE_NAME,
  OTEL_SCOPE_VERSION,
  SPAN_KIND_LLM,
  SPAN_KIND_TOOL,
  SPAN_KIND_MEMORY,
  SPAN_KIND_DECISION,
  LANGSMITH_RUN_TYPE_LLM,
  LANGSMITH_RUN_TYPE_CHAIN,
  LANGSMITH_RUN_TYPE_TOOL,
  TOKEN_COUNT_INPUT_KEY,
  TOKEN_COUNT_OUTPUT_KEY,
  TOKEN_COUNT_TOTAL_KEY,
  EVALUATE_SCORE_KEY,
  EVALUATE_LABEL_KEY,
  EVALUATE_COMMENT_KEY,
  STRING_ATTRIBUTE_MAX_LENGTH,
  PROMPT_ATTRIBUTE_MAX_LENGTH,
  TOOL_INPUT_ATTRIBUTE_MAX_LENGTH,
  ExporterType,
  AgentSpanKind,
};
