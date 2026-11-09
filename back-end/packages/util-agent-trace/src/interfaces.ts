import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import type {
  ActiveSpan,
  LlmSpanInput,
  ToolSpanInput,
  MemorySpanInput,
  DecisionSpanInput,
  SpanAttributes,
} from "./types.js";

/**
 * Contract for span exporters used by AgentTrace.
 * Wraps the OTel SpanExporter interface for internal use.
 */
interface ISpanExporter {
  export(span: ReadableSpan): void;
  shutdown(): Promise<void>;
}

/**
 * Public contract for the AgentTrace service.
 */
interface IAgentTrace {
  startLlmSpan(
    name: string,
    input: LlmSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan;
  startToolSpan(
    name: string,
    input: ToolSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan;
  startMemorySpan(
    name: string,
    input: MemorySpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan;
  startDecisionSpan(
    name: string,
    input: DecisionSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan;
  injectContext(
    headers: Record<string, string>,
    activeSpan?: ActiveSpan
  ): Record<string, string>;
  extractContext(headers: Record<string, string>): SpanAttributes | undefined;
  shutdown(): Promise<void>;
}

export type { ISpanExporter, IAgentTrace };
