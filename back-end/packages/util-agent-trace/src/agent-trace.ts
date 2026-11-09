import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import type {
  Context,
  Span,
  TextMapGetter,
  TextMapSetter,
} from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  OTEL_SCOPE_NAME,
  OTEL_SCOPE_VERSION,
  TOKEN_COUNT_INPUT_KEY,
  TOKEN_COUNT_OUTPUT_KEY,
  TOKEN_COUNT_TOTAL_KEY,
  EVALUATE_SCORE_KEY,
  EVALUATE_LABEL_KEY,
  EVALUATE_COMMENT_KEY,
} from "./constants.js";
import { parseAgentTraceConfig } from "./config.js";
import { createOtlpExporter } from "./exporters/otlp.exporter.js";
import { createConsoleExporter } from "./exporters/console.exporter.js";
import { LangSmithSpanExporter } from "./exporters/langsmith.exporter.js";
import { applyLlmAttributes } from "./spans/llm.span.js";
import { applyToolAttributes } from "./spans/tool.span.js";
import { applyMemoryAttributes } from "./spans/memory.span.js";
import { applyDecisionAttributes } from "./spans/decision.span.js";
import type {
  AgentTraceRawConfig,
  AgentTraceConfig,
  ActiveSpan,
  LlmSpanInput,
  ToolSpanInput,
  MemorySpanInput,
  DecisionSpanInput,
  SpanAttributes,
  TokenUsage,
  EvalResult,
  ExporterConfig,
} from "./types.js";
import type { IAgentTrace } from "./interfaces.js";

const HEADER_MAP_GETTER: TextMapGetter<Record<string, string>> = {
  get: (carrier, key) => carrier[key],
  keys: (carrier) => Object.keys(carrier),
};

const HEADER_MAP_SETTER: TextMapSetter<Record<string, string>> = {
  set: (carrier, key, value) => {
    carrier[key] = value;
  },
};

const buildActiveSpan = (otelSpan: Span): ActiveSpan => {
  const ctx = otelSpan.spanContext();
  return {
    spanId: ctx.spanId,
    traceId: ctx.traceId,
    addAttribute(key: string, value: string | number | boolean): void {
      otelSpan.setAttribute(key, value);
    },
    addEvent(name: string, attributes?: SpanAttributes): void {
      otelSpan.addEvent(
        name,
        attributes as Record<string, string | number | boolean | string[]>
      );
    },
    setTokenUsage(usage: TokenUsage): void {
      if (usage.inputTokens !== undefined) {
        otelSpan.setAttribute(TOKEN_COUNT_INPUT_KEY, usage.inputTokens);
      }
      if (usage.outputTokens !== undefined) {
        otelSpan.setAttribute(TOKEN_COUNT_OUTPUT_KEY, usage.outputTokens);
      }
      if (usage.totalTokens !== undefined) {
        otelSpan.setAttribute(TOKEN_COUNT_TOTAL_KEY, usage.totalTokens);
      }
    },
    setEvalResult(result: EvalResult): void {
      if (result.score !== undefined) {
        otelSpan.setAttribute(EVALUATE_SCORE_KEY, result.score);
      }
      if (result.label !== undefined) {
        otelSpan.setAttribute(EVALUATE_LABEL_KEY, result.label);
      }
      if (result.comment !== undefined) {
        otelSpan.setAttribute(EVALUATE_COMMENT_KEY, result.comment);
      }
    },
    end(error?: Error): void {
      if (error) {
        otelSpan.recordException(error);
        otelSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      }
      otelSpan.end();
    },
  };
};

const contextFromActiveSpan = (activeSpan: ActiveSpan): Context =>
  trace.setSpan(context.active(), {
    spanContext: () => ({
      traceId: activeSpan.traceId,
      spanId: activeSpan.spanId,
      traceFlags: 1,
      isRemote: false,
    }),
    setAttribute: () => ({ spanContext: () => ({}) }) as unknown as Span,
    setAttributes: () => ({ spanContext: () => ({}) }) as unknown as Span,
    addEvent: () => ({ spanContext: () => ({}) }) as unknown as Span,
    addLink: () => ({ spanContext: () => ({}) }) as unknown as Span,
    addLinks: () => ({ spanContext: () => ({}) }) as unknown as Span,
    setStatus: () => ({ spanContext: () => ({}) }) as unknown as Span,
    updateName: () => ({ spanContext: () => ({}) }) as unknown as Span,
    end: () => {},
    isRecording: () => false,
    recordException: () => {},
  } as Span);

class AgentTrace implements IAgentTrace {
  #provider: NodeTracerProvider;
  #propagator: W3CTraceContextPropagator;
  #config: AgentTraceConfig;

  constructor(rawConfig: AgentTraceRawConfig = {}) {
    this.#config = parseAgentTraceConfig(rawConfig);
    this.#propagator = new W3CTraceContextPropagator();
    this.#provider = this.#buildProvider();
  }

  #buildProvider(): NodeTracerProvider {
    const resource = new Resource({
      "service.name": this.#config.serviceName,
      ...this.#config.defaultAttributes,
    });

    const provider = new NodeTracerProvider({ resource });

    for (const exporterConfig of this.#config.exporters) {
      this.#addProcessor(provider, exporterConfig);
    }

    return provider;
  }

  #addProcessor(
    provider: NodeTracerProvider,
    exporterConfig: ExporterConfig
  ): void {
    if (exporterConfig.type === "otlp") {
      const exporter = createOtlpExporter(exporterConfig);
      provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    } else if (exporterConfig.type === "console") {
      const exporter = createConsoleExporter();
      provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    } else if (exporterConfig.type === "langsmith") {
      LangSmithSpanExporter.create(exporterConfig)
        .then((exporter) => {
          provider.addSpanProcessor(new BatchSpanProcessor(exporter));
        })
        .catch((err: unknown) => {
          console.error(
            "[util-agent-trace] Failed to initialize LangSmith exporter:",
            err
          );
        });
    }
  }

  #getTracer() {
    return this.#provider.getTracer(OTEL_SCOPE_NAME, OTEL_SCOPE_VERSION);
  }

  #applyDefaultAttributes(span: Span): void {
    for (const [k, v] of Object.entries(this.#config.defaultAttributes)) {
      span.setAttribute(k, v);
    }
  }

  startLlmSpan(
    name: string,
    input: LlmSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan {
    const ctx = parentSpan
      ? contextFromActiveSpan(parentSpan)
      : context.active();
    const span = this.#getTracer().startSpan(
      name,
      { kind: SpanKind.INTERNAL },
      ctx
    );
    this.#applyDefaultAttributes(span);
    applyLlmAttributes(span, input);
    return buildActiveSpan(span);
  }

  startToolSpan(
    name: string,
    input: ToolSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan {
    const ctx = parentSpan
      ? contextFromActiveSpan(parentSpan)
      : context.active();
    const span = this.#getTracer().startSpan(
      name,
      { kind: SpanKind.INTERNAL },
      ctx
    );
    this.#applyDefaultAttributes(span);
    applyToolAttributes(span, input);
    return buildActiveSpan(span);
  }

  startMemorySpan(
    name: string,
    input: MemorySpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan {
    const ctx = parentSpan
      ? contextFromActiveSpan(parentSpan)
      : context.active();
    const span = this.#getTracer().startSpan(
      name,
      { kind: SpanKind.INTERNAL },
      ctx
    );
    this.#applyDefaultAttributes(span);
    applyMemoryAttributes(span, input);
    return buildActiveSpan(span);
  }

  startDecisionSpan(
    name: string,
    input: DecisionSpanInput,
    parentSpan?: ActiveSpan
  ): ActiveSpan {
    const ctx = parentSpan
      ? contextFromActiveSpan(parentSpan)
      : context.active();
    const span = this.#getTracer().startSpan(
      name,
      { kind: SpanKind.INTERNAL },
      ctx
    );
    this.#applyDefaultAttributes(span);
    applyDecisionAttributes(span, input);
    return buildActiveSpan(span);
  }

  injectContext(
    headers: Record<string, string>,
    activeSpan?: ActiveSpan
  ): Record<string, string> {
    const ctx = activeSpan
      ? contextFromActiveSpan(activeSpan)
      : context.active();
    const output = { ...headers };
    this.#propagator.inject(ctx, output, HEADER_MAP_SETTER);
    return output;
  }

  extractContext(headers: Record<string, string>): SpanAttributes | undefined {
    const ctx = this.#propagator.extract(
      context.active(),
      headers,
      HEADER_MAP_GETTER
    );
    const span = trace.getSpan(ctx);
    if (!span) return undefined;
    const spanCtx = span.spanContext();
    if (!spanCtx.traceId) return undefined;
    return {
      traceId: spanCtx.traceId,
      spanId: spanCtx.spanId,
    };
  }

  async shutdown(): Promise<void> {
    await this.#provider.shutdown();
  }
}

export { AgentTrace, buildActiveSpan, contextFromActiveSpan };
