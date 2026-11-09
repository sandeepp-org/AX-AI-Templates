import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import type { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base";

class ConsoleSpanExporter implements SpanExporter {
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    for (const span of spans) {
      const ctx = span.spanContext();
      const durationMs = span.duration[0] * 1000 + span.duration[1] / 1_000_000;
      console.log(
        JSON.stringify({
          name: span.name,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          parentSpanId: span.parentSpanId,
          durationMs: Math.round(durationMs),
          attributes: span.attributes,
          events: span.events.map((e) => ({
            name: e.name,
            attributes: e.attributes,
          })),
          status: span.status,
        })
      );
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

const createConsoleExporter = (): ConsoleSpanExporter =>
  new ConsoleSpanExporter();

export { ConsoleSpanExporter, createConsoleExporter };
