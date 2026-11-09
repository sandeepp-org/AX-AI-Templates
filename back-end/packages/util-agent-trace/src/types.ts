import type { ExporterType, AgentSpanKind } from "./constants.js";

type ExporterTypeValue = (typeof ExporterType)[keyof typeof ExporterType];
type AgentSpanKindValue = (typeof AgentSpanKind)[keyof typeof AgentSpanKind];

type SpanAttributes = Record<string, string | number | boolean | string[]>;

type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type EvalResult = {
  score?: number;
  label?: string;
  comment?: string;
};

type OtlpExporterConfig = {
  type: "otlp";
  endpoint?: string;
  headers?: Record<string, string>;
};

type ConsoleExporterConfig = {
  type: "console";
};

type LangSmithExporterConfig = {
  type: "langsmith";
  apiKey: string;
  project?: string;
};

type ExporterConfig =
  | OtlpExporterConfig
  | ConsoleExporterConfig
  | LangSmithExporterConfig;

type AgentTraceRawConfig = {
  serviceName?: string;
  exporters?: ExporterConfig[];
  langsmithApiKey?: string;
  langsmithProject?: string;
  defaultAttributes?: Record<string, string | number | boolean>;
};

type AgentTraceConfig = {
  serviceName: string;
  exporters: ExporterConfig[];
  defaultAttributes: Record<string, string | number | boolean>;
};

type LlmSpanInput = {
  model: string;
  provider?: string;
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  attributes?: SpanAttributes;
};

type ToolSpanInput = {
  toolName: string;
  toolInput?: unknown;
  attributes?: SpanAttributes;
};

type MemorySpanInput = {
  operation: "read" | "write" | "delete" | "search";
  memoryKey?: string;
  agentId?: string;
  attributes?: SpanAttributes;
};

type DecisionSpanInput = {
  step: string;
  rationale?: string;
  options?: string[];
  attributes?: SpanAttributes;
};

type ActiveSpan = {
  spanId: string;
  traceId: string;
  addAttribute(key: string, value: string | number | boolean): void;
  addEvent(name: string, attributes?: SpanAttributes): void;
  setTokenUsage(usage: TokenUsage): void;
  setEvalResult(result: EvalResult): void;
  end(error?: Error): void;
};

type TraceContextHeaders = {
  traceparent: string;
  tracestate?: string;
};

export type {
  ExporterTypeValue,
  AgentSpanKindValue,
  SpanAttributes,
  TokenUsage,
  EvalResult,
  OtlpExporterConfig,
  ConsoleExporterConfig,
  LangSmithExporterConfig,
  ExporterConfig,
  AgentTraceRawConfig,
  AgentTraceConfig,
  LlmSpanInput,
  ToolSpanInput,
  MemorySpanInput,
  DecisionSpanInput,
  ActiveSpan,
  TraceContextHeaders,
};
