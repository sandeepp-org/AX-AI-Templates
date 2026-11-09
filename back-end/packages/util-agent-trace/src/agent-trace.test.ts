import { AgentTrace } from "./agent-trace.js";

const HEX_TRACE_ID = /^[0-9a-f]{32}$/;
const HEX_SPAN_ID = /^[0-9a-f]{16}$/;

describe("AgentTrace — constructor and config", () => {
  let tracer: AgentTrace;

  afterEach(async () => {
    await tracer.shutdown();
  });

  it("instantiates with zero config using all defaults", () => {
    tracer = new AgentTrace();
    expect(tracer).toBeInstanceOf(AgentTrace);
  });

  it("instantiates with explicit serviceName", () => {
    tracer = new AgentTrace({ serviceName: "my-agent" });
    expect(tracer).toBeInstanceOf(AgentTrace);
  });

  it("instantiates with console exporter config", () => {
    tracer = new AgentTrace({ exporters: [{ type: "console" }] });
    expect(tracer).toBeInstanceOf(AgentTrace);
  });

  it("instantiates with OTLP exporter config", () => {
    tracer = new AgentTrace({
      exporters: [
        { type: "otlp", endpoint: "http://localhost:4318/v1/traces" },
      ],
    });
    expect(tracer).toBeInstanceOf(AgentTrace);
  });

  it("throws ZodError for empty serviceName", () => {
    expect(() => new AgentTrace({ serviceName: "" })).toThrow();
  });

  it("instantiates with defaultAttributes", () => {
    tracer = new AgentTrace({
      exporters: [{ type: "console" }],
      defaultAttributes: { environment: "test", version: "1.0" },
    });
    expect(tracer).toBeInstanceOf(AgentTrace);
  });
});

describe("AgentTrace — LLM span lifecycle", () => {
  let tracer: AgentTrace;

  beforeEach(() => {
    tracer = new AgentTrace({ exporters: [{ type: "console" }] });
  });

  afterEach(async () => {
    await tracer.shutdown();
  });

  it("startLlmSpan returns ActiveSpan with valid traceId and spanId", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(span.traceId).toMatch(HEX_TRACE_ID);
    expect(span.spanId).toMatch(HEX_SPAN_ID);
    span.end();
  });

  it("addAttribute does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() => span.addAttribute("custom.key", "value")).not.toThrow();
    span.end();
  });

  it("addEvent does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() => span.addEvent("token.generated", { count: 5 })).not.toThrow();
    span.end();
  });

  it("setTokenUsage does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() =>
      span.setTokenUsage({
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      })
    ).not.toThrow();
    span.end();
  });

  it("setEvalResult does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() =>
      span.setEvalResult({ score: 0.9, label: "pass", comment: "looks good" })
    ).not.toThrow();
    span.end();
  });

  it("end() without error does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() => span.end()).not.toThrow();
  });

  it("end(error) does not throw", () => {
    const span = tracer.startLlmSpan("llm-call", { model: "gpt-4o" });
    expect(() => span.end(new Error("LLM request failed"))).not.toThrow();
  });
});

describe("AgentTrace — span types", () => {
  let tracer: AgentTrace;

  beforeEach(() => {
    tracer = new AgentTrace({ exporters: [{ type: "console" }] });
  });

  afterEach(async () => {
    await tracer.shutdown();
  });

  it("startToolSpan returns ActiveSpan with valid IDs", () => {
    const span = tracer.startToolSpan("tool-call", { toolName: "search" });
    expect(span.traceId).toMatch(HEX_TRACE_ID);
    expect(span.spanId).toMatch(HEX_SPAN_ID);
    span.end();
  });

  it("startMemorySpan returns ActiveSpan with valid IDs", () => {
    const span = tracer.startMemorySpan("memory-op", { operation: "read" });
    expect(span.traceId).toMatch(HEX_TRACE_ID);
    expect(span.spanId).toMatch(HEX_SPAN_ID);
    span.end();
  });

  it("startDecisionSpan returns ActiveSpan with valid IDs", () => {
    const span = tracer.startDecisionSpan("decide", { step: "choose-tool" });
    expect(span.traceId).toMatch(HEX_TRACE_ID);
    expect(span.spanId).toMatch(HEX_SPAN_ID);
    span.end();
  });

  it("startLlmSpan with all optional fields does not throw", () => {
    expect(() => {
      const span = tracer.startLlmSpan("llm-full", {
        model: "claude-sonnet-4-6",
        provider: "anthropic",
        prompt: "Explain quantum computing",
        systemPrompt: "You are a helpful assistant",
        temperature: 0.7,
        maxTokens: 1024,
        attributes: { "custom.tag": "v1" },
      });
      span.end();
    }).not.toThrow();
  });

  it("startToolSpan with toolInput does not throw", () => {
    expect(() => {
      const span = tracer.startToolSpan("search", {
        toolName: "web_search",
        toolInput: { query: "OpenTelemetry Node.js", limit: 5 },
      });
      span.end();
    }).not.toThrow();
  });

  it("startMemorySpan with all optional fields does not throw", () => {
    expect(() => {
      const span = tracer.startMemorySpan("memory-write", {
        operation: "write",
        memoryKey: "session-123",
        agentId: "agent-abc",
      });
      span.end();
    }).not.toThrow();
  });

  it("startDecisionSpan with options does not throw", () => {
    expect(() => {
      const span = tracer.startDecisionSpan("pick-action", {
        step: "route-request",
        rationale: "User asked a factual question",
        options: ["search", "memory", "llm-direct"],
      });
      span.end();
    }).not.toThrow();
  });
});

describe("AgentTrace — parent-child linking", () => {
  let tracer: AgentTrace;

  beforeEach(() => {
    tracer = new AgentTrace({ exporters: [{ type: "console" }] });
  });

  afterEach(async () => {
    await tracer.shutdown();
  });

  it("child span has a different spanId from parent", () => {
    const parent = tracer.startLlmSpan("parent", { model: "gpt-4o" });
    const child = tracer.startToolSpan("child", { toolName: "tool" }, parent);
    expect(child.spanId).not.toBe(parent.spanId);
    child.end();
    parent.end();
  });

  it("child span shares the same traceId as parent", () => {
    const parent = tracer.startLlmSpan("parent", { model: "gpt-4o" });
    const child = tracer.startMemorySpan(
      "child",
      { operation: "read" },
      parent
    );
    expect(child.traceId).toBe(parent.traceId);
    child.end();
    parent.end();
  });

  it("deeply nested child retains same traceId", () => {
    const root = tracer.startDecisionSpan("root", { step: "start" });
    const mid = tracer.startLlmSpan("mid", { model: "gpt-4o" }, root);
    const leaf = tracer.startToolSpan("leaf", { toolName: "calc" }, mid);
    expect(leaf.traceId).toBe(root.traceId);
    leaf.end();
    mid.end();
    root.end();
  });
});

describe("AgentTrace — context propagation", () => {
  let tracer: AgentTrace;

  beforeEach(() => {
    tracer = new AgentTrace({ exporters: [{ type: "console" }] });
  });

  afterEach(async () => {
    await tracer.shutdown();
  });

  it("injectContext returns object containing traceparent key", () => {
    const span = tracer.startLlmSpan("call", { model: "gpt-4o" });
    const headers = tracer.injectContext({}, span);
    expect(headers).toHaveProperty("traceparent");
    expect(typeof headers["traceparent"]).toBe("string");
    span.end();
  });

  it("injectContext traceparent references the active span", () => {
    const span = tracer.startLlmSpan("call", { model: "gpt-4o" });
    const headers = tracer.injectContext({}, span);
    expect(headers["traceparent"]).toContain(span.traceId);
    expect(headers["traceparent"]).toContain(span.spanId);
    span.end();
  });

  it("injectContext preserves existing headers", () => {
    const span = tracer.startLlmSpan("call", { model: "gpt-4o" });
    const headers = tracer.injectContext({ "x-custom": "value" }, span);
    expect(headers["x-custom"]).toBe("value");
    expect(headers).toHaveProperty("traceparent");
    span.end();
  });

  it("extractContext from injected headers returns span context attributes", () => {
    const span = tracer.startLlmSpan("call", { model: "gpt-4o" });
    const injected = tracer.injectContext({}, span);
    const extracted = tracer.extractContext(injected);
    expect(extracted).not.toBeUndefined();
    expect(extracted!["traceId"]).toBe(span.traceId);
    span.end();
  });

  it("extractContext from empty headers returns undefined", () => {
    const result = tracer.extractContext({});
    expect(result).toBeUndefined();
  });
});

describe("AgentTrace — shutdown", () => {
  it("shutdown() resolves without error", async () => {
    const tracer = new AgentTrace({ exporters: [{ type: "console" }] });
    await expect(tracer.shutdown()).resolves.toBeUndefined();
  });

  it("multiple AgentTrace instances shut down independently", async () => {
    const t1 = new AgentTrace({
      serviceName: "svc1",
      exporters: [{ type: "console" }],
    });
    const t2 = new AgentTrace({
      serviceName: "svc2",
      exporters: [{ type: "console" }],
    });
    await expect(
      Promise.all([t1.shutdown(), t2.shutdown()])
    ).resolves.toBeDefined();
  });
});

describe("AgentTrace — LangSmith config", () => {
  it("instantiates without error when langsmithApiKey is provided", () => {
    expect(
      () =>
        new AgentTrace({
          langsmithApiKey: "test-key-123",
          exporters: [{ type: "console" }],
        })
    ).not.toThrow();
  });

  it("instantiates normally when langsmithApiKey is absent", () => {
    const tracer = new AgentTrace({ exporters: [{ type: "console" }] });
    expect(tracer).toBeInstanceOf(AgentTrace);
    tracer.shutdown();
  });
});
