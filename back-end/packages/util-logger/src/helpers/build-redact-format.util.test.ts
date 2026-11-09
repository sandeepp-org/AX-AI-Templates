import winston from "winston";
import { Writable } from "node:stream";
import {
  buildRedactFormat,
  REDACTED_VALUE,
} from "./build-redact-format.util.js";

/**
 * Logs a message through a winston logger with the given format and captures the JSON output.
 */
const captureLog = async (
  format: winston.Logform.Format,
  msg: string,
  meta: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });

  const logger = winston.createLogger({
    format,
    transports: [new winston.transports.Stream({ stream })],
  });

  logger.info(msg, meta);

  await new Promise<void>((resolve) => {
    logger.on("finish", () => resolve());
    logger.end();
  });

  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;

  return parsed;
};

describe("buildRedactFormat", () => {
  const baseFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );

  it("should redact a top-level field", async () => {
    const field = "password";
    const format = buildRedactFormat([field], baseFormat);

    const output = await captureLog(format, "test", { password: "s3cret" });

    expect(output.password).toBe(REDACTED_VALUE);
  });

  it("should redact a nested field using dot notation", async () => {
    const format = buildRedactFormat(["user.token"], baseFormat);

    const output = await captureLog(format, "test", {
      user: { token: "abc123", name: "alice" },
    });
    const user = output.user as Record<string, unknown>;

    expect(user.token).toBe(REDACTED_VALUE);
    expect(user.name).toBe("alice");
  });

  it("should redact multiple paths at once", async () => {
    const format = buildRedactFormat(["password", "apiKey"], baseFormat);

    const output = await captureLog(format, "test", {
      password: "s3cret",
      apiKey: "key-123",
      safe: "visible",
    });

    expect(output.password).toBe(REDACTED_VALUE);
    expect(output.apiKey).toBe(REDACTED_VALUE);
    expect(output.safe).toBe("visible");
  });

  it("should leave output unchanged when redact path does not exist", async () => {
    const format = buildRedactFormat(["nonexistent"], baseFormat);

    const output = await captureLog(format, "test", { name: "alice" });

    expect(output.name).toBe("alice");
    expect(output.nonexistent).toBeUndefined();
  });
});
