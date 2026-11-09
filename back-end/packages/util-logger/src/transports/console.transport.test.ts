import winston from "winston";
import { Writable } from "node:stream";
import { createConsoleTransport } from "./console.transport.js";
import { CUSTOM_LEVELS } from "../constants.js";

// How this test is planed
// 1. create a transport
// 2. create a stream
// 3. create a logger
// 4. log a message
// 5. flush the logger
// 6. return the output

const captureOutput = async (
  transport: winston.transport,
  level: string,
  msg: string,
  meta?: Record<string, unknown>
): Promise<string[]> => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      lines.push(chunk.toString().trim());
      cb();
    },
  });

  const streamTransport = new winston.transports.Stream({
    stream,
    format: transport.format,
    level: transport.level,
  });

  const logger = winston.createLogger({
    levels: CUSTOM_LEVELS,
    level: "fatal",
    transports: [streamTransport],
  });

  if (meta) {
    logger.log(level, msg, meta);
  } else {
    logger.log(level, msg);
  }

  await new Promise<void>((resolve) => {
    logger.on("finish", resolve);
    logger.end();
  });

  return lines;
};

describe("createConsoleTransport", () => {
  it("should return a transport instance", () => {
    const transport = createConsoleTransport({ type: "console" });
    expect(transport).toBeDefined();
  });

  it("simple format should produce 'level: message' style output", async () => {
    const transport = createConsoleTransport({
      type: "console",
      format: "simple",
    });

    const lines = await captureOutput(transport, "info", "hello world");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("info");
    expect(lines[0]).toContain("hello world");
  });

  it("json format should produce parseable JSON output", async () => {
    const transport = createConsoleTransport({
      type: "console",
      format: "json",
    });

    const lines = await captureOutput(transport, "warn", "json test", {
      key: "value",
    });

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("json test");
    expect(parsed.key).toBe("value");
  });

  it("json format metadata should be spread into the entry", async () => {
    const transport = createConsoleTransport({
      type: "console",
      format: "json",
    });

    const lines = await captureOutput(transport, "info", "request", {
      method: "POST",
      path: "/api",
      status: 201,
    });

    const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(parsed.method).toBe("POST");
    expect(parsed.path).toBe("/api");
    expect(parsed.status).toBe(201);
  });

  it("level option should filter messages above the transport level", async () => {
    const transport = createConsoleTransport({
      type: "console",
      level: "info",
      format: "json",
    });

    const infoLines = await captureOutput(transport, "info", "should appear");
    expect(infoLines).toHaveLength(1);

    const warnLines = await captureOutput(
      transport,
      "warn",
      "should be filtered"
    );
    expect(warnLines).toHaveLength(0);
  });

  it("default format (no format specified) should produce output", async () => {
    const transport = createConsoleTransport({ type: "console" });

    const lines = await captureOutput(transport, "info", "default format");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("default format");
  });
});
