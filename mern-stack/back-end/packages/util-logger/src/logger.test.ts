import winston from "winston";
import { Writable } from "node:stream";
import { Logger } from "./logger.js";
import { CUSTOM_LEVELS } from "./constants.js";

type LogEntry = Record<string, unknown>;

const createCaptureStream = (): { stream: Writable; lines: string[] } => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      lines.push(chunk.toString().trim());
      cb();
    },
  });
  return { stream, lines };
};

const createStreamTransport = (stream: Writable): winston.transport =>
  new winston.transports.Stream({
    stream,
    format: winston.format.json(),
  });

const createTestLogger = (
  level: string,
  stream: Writable,
  opts?: { defaultMeta?: Record<string, unknown> }
): winston.Logger =>
  winston.createLogger({
    levels: CUSTOM_LEVELS,
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: opts?.defaultMeta,
    transports: [createStreamTransport(stream)],
  });

const flush = async (logger: winston.Logger): Promise<void> => {
  await new Promise<void>((resolve) => {
    logger.on("finish", resolve);
    logger.end();
  });
};

const parseLine = (line: string): LogEntry => JSON.parse(line) as LogEntry;

describe("Logger — singleton lifecycle", () => {
  let instance: Logger | null = null;

  afterEach(async () => {
    if (instance) {
      await instance.close();
      instance = null;
    }
  });

  it("create should return instance and getInstance should return same reference", async () => {
    instance = await Logger.create({
      level: "debug",
      transports: [{ type: "console", format: "simple" }],
    });
    expect(Logger.getInstance()).toBe(instance);
  });

  it("getInstance should throw when create has not been called", () => {
    expect(() => Logger.getInstance()).toThrow(
      "Logger not initialized. Call Logger.create() first."
    );
  });

  it("close should clear singleton so getInstance throws", async () => {
    instance = await Logger.create({
      level: "info",
      transports: [{ type: "console", format: "simple" }],
    });
    await instance.close();
    expect(() => Logger.getInstance()).toThrow("Logger not initialized");
    instance = null;
  });

  it("should reinitialize cleanly after close and create", async () => {
    const first = await Logger.create({
      level: "debug",
      transports: [{ type: "console", format: "simple" }],
    });
    await first.close();

    instance = await Logger.create({
      level: "info",
      transports: [{ type: "console", format: "simple" }],
    });

    expect(instance).not.toBe(first);
    expect(instance.level).toBe("info");
    expect(Logger.getInstance()).toBe(instance);
  });

  it("should work with zero config (defaults)", async () => {
    instance = await Logger.create();
    expect(instance).toBeDefined();
    expect(instance.level).toBe("info");
  });
});

describe("Logger — log output verification", () => {
  it("info should produce JSON with level, message, timestamp, and metadata", () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream);

    logger.info("hello world", { userId: 42 });
    logger.end();

    const entry = parseLine(lines[0]);
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("hello world");
    expect(entry.userId).toBe(42);
    expect(entry.timestamp).toBeDefined();
  });

  it("each log level should produce the correct level field in output", async () => {
    const levels = [
      "trace",
      "debug",
      "info",
      "warn",
      "error",
      "fatal",
    ] as const;

    for (const lvl of levels) {
      const { stream, lines } = createCaptureStream();
      const logger = createTestLogger("fatal", stream);

      logger.log(lvl, `${lvl} message`);
      await flush(logger);

      expect(lines).toHaveLength(1);
      const entry = parseLine(lines[0]);
      expect(entry.level).toBe(lvl);
      expect(entry.message).toBe(`${lvl} message`);
    }
  });

  it("metadata object should be spread into the log entry", () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream);

    logger.info("request", { method: "GET", path: "/api/users", status: 200 });
    logger.end();

    const entry = parseLine(lines[0]);
    expect(entry.method).toBe("GET");
    expect(entry.path).toBe("/api/users");
    expect(entry.status).toBe(200);
  });
});

describe("Logger — level filtering", () => {
  it("should only log levels with numeric priority <= configured level", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("info", stream);

    logger.log("trace", "trace msg");
    logger.log("debug", "debug msg");
    logger.log("info", "info msg");
    logger.log("warn", "warn msg");
    logger.log("error", "error msg");
    logger.log("fatal", "fatal msg");
    await flush(logger);

    const levels = lines.map((l) => parseLine(l).level);
    expect(levels).toEqual(["trace", "debug", "info"]);
  });

  it("level fatal (highest number) should let all messages through", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream);

    logger.log("trace", "t");
    logger.log("debug", "d");
    logger.log("info", "i");
    logger.log("warn", "w");
    logger.log("error", "e");
    logger.log("fatal", "f");
    await flush(logger);

    expect(lines).toHaveLength(6);
  });

  it("level trace (lowest number) should only allow trace", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("trace", stream);

    logger.log("trace", "visible");
    logger.log("debug", "filtered");
    logger.log("info", "filtered");
    await flush(logger);

    expect(lines).toHaveLength(1);
    expect(parseLine(lines[0]).level).toBe("trace");
  });

  it("level setter should take effect immediately", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("trace", stream);

    logger.log("debug", "filtered before");
    logger.level = "debug";
    logger.log("debug", "now visible");
    await flush(logger);

    expect(lines).toHaveLength(1);
    expect(parseLine(lines[0]).message).toBe("now visible");
  });
});

describe("Logger — child logger", () => {
  it("child bindings should appear in every log entry", async () => {
    const { stream, lines } = createCaptureStream();
    const parent = createTestLogger("fatal", stream);

    const child = parent.child({ requestId: "req-abc", service: "auth" });
    child.info("child message", { extra: true });
    await flush(parent);

    expect(lines).toHaveLength(1);
    const entry = parseLine(lines[0]);
    expect(entry.message).toBe("child message");
    expect(entry.requestId).toBe("req-abc");
    expect(entry.service).toBe("auth");
    expect(entry.extra).toBe(true);
  });

  it("nested children should accumulate bindings from all ancestors", async () => {
    const { stream, lines } = createCaptureStream();
    const root = createTestLogger("fatal", stream);

    const child1 = root.child({ requestId: "req-1" });
    const child2 = child1.child({ userId: "user-42" });
    child2.info("deep child");
    await flush(root);

    expect(lines).toHaveLength(1);
    const entry = parseLine(lines[0]);
    expect(entry.requestId).toBe("req-1");
    expect(entry.userId).toBe("user-42");
    expect(entry.message).toBe("deep child");
  });

  it("child should inherit parent level filtering", async () => {
    const { stream, lines } = createCaptureStream();
    const parent = createTestLogger("info", stream);

    const child = parent.child({ scope: "test" });
    child.log("warn", "should be filtered");
    child.log("info", "should appear");
    await flush(parent);

    expect(lines).toHaveLength(1);
    expect(parseLine(lines[0]).message).toBe("should appear");
  });

  it("child should not be the same reference as parent (Logger wrapper)", async () => {
    const instance = await Logger.create({
      level: "info",
      transports: [{ type: "console", format: "simple" }],
    });

    const child = instance.child({ scope: "test" });
    expect(child).not.toBe(instance);
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
    expect(typeof child.child).toBe("function");
    await instance.close();
  });

  it("parent log should NOT include child bindings", async () => {
    const { stream, lines } = createCaptureStream();
    const parent = createTestLogger("fatal", stream);

    parent.child({ childOnly: true });
    parent.info("parent log");
    await flush(parent);

    const entry = parseLine(lines[0]);
    expect(entry.childOnly).toBeUndefined();
  });
});

describe("Logger — defaultMeta and context", () => {
  it("defaultMeta fields should appear in every log entry", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream, {
      defaultMeta: { service: "api", version: "2.0" },
    });

    logger.info("boot");
    logger.warn("check");
    await flush(logger);

    for (const line of lines) {
      const entry = parseLine(line);
      expect(entry.service).toBe("api");
      expect(entry.version).toBe("2.0");
    }
  });

  it("per-message metadata should merge with defaultMeta", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream, {
      defaultMeta: { service: "api" },
    });

    logger.info("req", { path: "/users" });
    await flush(logger);

    const entry = parseLine(lines[0]);
    expect(entry.service).toBe("api");
    expect(entry.path).toBe("/users");
  });
});

describe("Logger — redaction", () => {
  it("should redact specified fields in output", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream);

    const { buildRedactFormat } =
      await import("./helpers/build-redact-format.util.js");
    logger.format = buildRedactFormat(["password", "token"], logger.format);

    logger.info("auth attempt", {
      password: "s3cret",
      token: "abc",
      user: "alice",
    });
    await flush(logger);

    const entry = parseLine(lines[0]);
    expect(entry.password).toBe("[Redacted]");
    expect(entry.token).toBe("[Redacted]");
    expect(entry.user).toBe("alice");
  });

  it("should leave non-redacted fields untouched", async () => {
    const { stream, lines } = createCaptureStream();
    const logger = createTestLogger("fatal", stream);

    const { buildRedactFormat } =
      await import("./helpers/build-redact-format.util.js");
    logger.format = buildRedactFormat(["secret"], logger.format);

    logger.info("safe", { public: "visible", count: 5 });
    await flush(logger);

    const entry = parseLine(lines[0]);
    expect(entry.public).toBe("visible");
    expect(entry.count).toBe(5);
  });
});
