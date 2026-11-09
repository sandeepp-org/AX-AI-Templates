import { z } from "zod";
import { AGENT_TRACE_SERVICE_NAME_DEFAULT } from "./constants.js";
import type { AgentTraceRawConfig, AgentTraceConfig } from "./types.js";

const otlpExporterConfigSchema = z.object({
  type: z.literal("otlp"),
  endpoint: z.string().url().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const consoleExporterConfigSchema = z.object({
  type: z.literal("console"),
});

const langsmithExporterConfigSchema = z.object({
  type: z.literal("langsmith"),
  apiKey: z.string().min(1),
  project: z.string().optional(),
});

const exporterConfigSchema = z.discriminatedUnion("type", [
  otlpExporterConfigSchema,
  consoleExporterConfigSchema,
  langsmithExporterConfigSchema,
]);

const agentTraceConfigSchema = z.object({
  serviceName: z.string().min(1).default(AGENT_TRACE_SERVICE_NAME_DEFAULT),
  exporters: z.array(exporterConfigSchema).default([{ type: "otlp" }]),
  langsmithApiKey: z.string().optional(),
  langsmithProject: z.string().optional(),
  defaultAttributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});

const parseAgentTraceConfig = (raw: AgentTraceRawConfig): AgentTraceConfig => {
  const parsed = agentTraceConfigSchema.parse(raw);

  const exporters = [...parsed.exporters];
  if (parsed.langsmithApiKey) {
    const hasLangSmith = exporters.some((e) => e.type === "langsmith");
    if (!hasLangSmith) {
      exporters.push({
        type: "langsmith",
        apiKey: parsed.langsmithApiKey,
        project: parsed.langsmithProject,
      });
    }
  }

  return {
    serviceName: parsed.serviceName,
    exporters,
    defaultAttributes: parsed.defaultAttributes,
  };
};

export { parseAgentTraceConfig, agentTraceConfigSchema };
