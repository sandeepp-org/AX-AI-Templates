import winston from "winston";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createFileTransport } from "./file.transport.js";

describe("createFileTransport", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "util-logger-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should return a transport instance", () => {
    const filename = join(tmpDir, "test.log");
    const transport = createFileTransport({
      type: "file",
      filename,
    });
    expect(transport).toBeDefined();
  });

  it("should be instance of File transport", () => {
    const filename = join(tmpDir, "test.log");
    const transport = createFileTransport({
      type: "file",
      filename,
    });
    expect(transport).toBeInstanceOf(winston.transports.File);
  });

  it("should accept level option", () => {
    const filename = join(tmpDir, "level.log");
    const transport = createFileTransport({
      type: "file",
      filename,
      level: "error",
      format: "json",
    });
    expect(transport).toBeDefined();
    expect(transport.level).toBe("error");
  });

  it("should accept format option", () => {
    const filename = join(tmpDir, "format.log");
    const transport = createFileTransport({
      type: "file",
      filename,
      format: "json",
    });
    expect(transport).toBeDefined();
    expect(transport.format).toBeDefined();
  });
});
