import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import type { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";
import {
  LANGSMITH_RUN_TYPE_LLM,
  LANGSMITH_RUN_TYPE_TOOL,
  LANGSMITH_RUN_TYPE_CHAIN,
  SPAN_KIND_LLM,
  SPAN_KIND_TOOL,
  TOKEN_COUNT_INPUT_KEY,
  TOKEN_COUNT_OUTPUT_KEY,
  TOKEN_COUNT_TOTAL_KEY,
} from "../constants.js";
import type { LangSmithExporterConfig } from "../types.js";

type LangSmithClient = {
  createRun(run: Record<string, unknown>): Promise<void>;
};

const resolveLangSmithRunType = (spanKind: string): string => {
  if (spanKind === SPAN_KIND_LLM) return LANGSMITH_RUN_TYPE_LLM;
  if (spanKind === SPAN_KIND_TOOL) return LANGSMITH_RUN_TYPE_TOOL;
  return LANGSMITH_RUN_TYPE_CHAIN;
};

class LangSmithSpanExporter implements SpanExporter {
  #client: LangSmithClient;
  #project: string | undefined;

  constructor(client: LangSmithClient, project?: string) {
    this.#client = client;
    this.#project = project;
  }

  static async create(
    config: LangSmithExporterConfig
  ): Promise<LangSmithSpanExporter> {
    let LangSmithClientClass: new (
      opts: Record<string, unknown>
    ) => LangSmithClient;
    try {
      const mod = await import("langsmith");
      LangSmithClientClass = (mod as Record<string, unknown>)[
        "Client"
      ] as typeof LangSmithClientClass;
    } catch {
      throw new Error(
        '[util-agent-trace] LangSmith exporter requires the "langsmith" package. ' +
          "Install it: pnpm add langsmith"
      );
    }

    const client = new LangSmithClientClass({
      apiKey: config.apiKey,
      projectName: config.project,
    });

    return new LangSmithSpanExporter(client, config.project);
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    const promises = spans.map((span) => {
      const ctx = span.spanContext();
      const attrs = span.attributes;
      const spanKind = (attrs["agenttrace.span.kind"] as string) ?? "chain";
      const runType = resolveLangSmithRunType(spanKind);

      const usage: Record<string, unknown> = {};
      if (attrs[TOKEN_COUNT_INPUT_KEY] !== undefined) {
        usage["prompt_tokens"] = attrs[TOKEN_COUNT_INPUT_KEY];
      }
      if (attrs[TOKEN_COUNT_OUTPUT_KEY] !== undefined) {
        usage["completion_tokens"] = attrs[TOKEN_COUNT_OUTPUT_KEY];
      }
      if (attrs[TOKEN_COUNT_TOTAL_KEY] !== undefined) {
        usage["total_tokens"] = attrs[TOKEN_COUNT_TOTAL_KEY];
      }

      const startTimeNs = span.startTime[0] * 1e9 + span.startTime[1];
      const endTimeNs = span.endTime[0] * 1e9 + span.endTime[1];

      const run: Record<string, unknown> = {
        id: ctx.spanId,
        trace_id: ctx.traceId,
        parent_run_id: span.parentSpanId ?? null,
        name: span.name,
        run_type: runType,
        start_time: new Date(startTimeNs / 1e6).toISOString(),
        end_time: new Date(endTimeNs / 1e6).toISOString(),
        inputs: attrs["gen_ai.prompt"]
          ? { prompt: attrs["gen_ai.prompt"] }
          : {},
        outputs: {},
        extra: {
          metadata: { ...attrs },
          usage: Object.keys(usage).length > 0 ? usage : undefined,
        },
        events: span.events.map((e) => ({
          name: e.name,
          time: e.time,
          attributes: e.attributes,
        })),
        error:
          span.status.code === 2
            ? ((attrs["exception.message"] as string) ?? "error")
            : undefined,
      };

      if (this.#project) {
        run["session_name"] = this.#project;
      }

      return this.#client.createRun(run).catch(() => {});
    });

    Promise.all(promises).then(() => {
      resultCallback({ code: ExportResultCode.SUCCESS });
    });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

export { LangSmithSpanExporter };
