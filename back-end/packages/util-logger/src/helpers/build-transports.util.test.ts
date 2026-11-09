import winston from "winston";
import { buildTransports } from "./build-transports.util.js";
import { TransportType } from "../constants.js";

describe("buildTransports", () => {
  it("should return one Console transport for single console config", async () => {
    const transports = await buildTransports([{ type: TransportType.CONSOLE }]);
    expect(transports).toHaveLength(1);
    expect(transports[0]).toBeInstanceOf(winston.transports.Console);
  });

  it("should return multiple Console transports for multiple console configs", async () => {
    const transports = await buildTransports([
      { type: TransportType.CONSOLE, level: "info" },
      { type: TransportType.CONSOLE, format: "json" },
    ]);
    expect(transports).toHaveLength(2);
    expect(transports[0]).toBeInstanceOf(winston.transports.Console);
    expect(transports[1]).toBeInstanceOf(winston.transports.Console);
  });

  it("should return empty array for empty config", async () => {
    const transports = await buildTransports([]);
    expect(transports).toEqual([]);
  });

  it("should apply level option to the console transport", async () => {
    const transports = await buildTransports([
      { type: TransportType.CONSOLE, level: "error" },
    ]);

    expect(transports).toHaveLength(1);
    expect(transports[0].level).toBe("error");
  });

  it("should build file transport", async () => {
    const transports = await buildTransports([
      {
        type: TransportType.FILE,
        filename: "/tmp/test.log",
      },
    ]);

    expect(transports).toHaveLength(1);
    expect(transports[0]).toBeInstanceOf(winston.transports.File);
  });

  const mongoUri =
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/winston-test";

  it("should build mongodb transport via dynamic import", async () => {
    const transports = await buildTransports([
      {
        type: TransportType.MONGODB,
        uri: mongoUri,
      },
    ]);

    expect(transports).toHaveLength(1);
    expect(transports[0]).toBeDefined();
    expect(transports[0]).not.toBeInstanceOf(winston.transports.Console);
  });

  it("should build mixed transport types in order", async () => {
    const transports = await buildTransports([
      { type: TransportType.CONSOLE, format: "json" },
      {
        type: TransportType.MONGODB,
        uri: mongoUri,
      },
    ]);

    expect(transports).toHaveLength(2);
    expect(transports[0]).toBeInstanceOf(winston.transports.Console);
    expect(transports[1]).not.toBeInstanceOf(winston.transports.Console);
  });
});
