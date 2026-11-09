import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLP_ENDPOINT_DEFAULT } from "../constants.js";
import type { OtlpExporterConfig } from "../types.js";

const createOtlpExporter = (config: OtlpExporterConfig): OTLPTraceExporter =>
  new OTLPTraceExporter({
    url: config.endpoint ?? OTLP_ENDPOINT_DEFAULT,
    headers: config.headers ?? {},
  });

export { createOtlpExporter };
