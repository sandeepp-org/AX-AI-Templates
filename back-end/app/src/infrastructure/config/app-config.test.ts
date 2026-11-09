import { readAppConfig } from "./app-config.js";

describe("readAppConfig", () => {
  it("should fall back to the defaults when nothing is set", () => {
    expect(readAppConfig({})).toEqual({
      nodeEnv: "development",
      isProduction: false,
      port: 3001,
      logLevel: "info",
    });
  });

  it("should read the values that are set", () => {
    expect(
      readAppConfig({ NODE_ENV: "production", PORT: "8080", LOG_LEVEL: "warn" })
    ).toEqual({
      nodeEnv: "production",
      isProduction: true,
      port: 8080,
      logLevel: "warn",
    });
  });

  it("should refuse a port that is not a whole number", () => {
    expect(() => readAppConfig({ PORT: "abc" })).toThrow(
      /PORT must be a whole number/
    );
  });

  it("should refuse a log level the logger does not know", () => {
    expect(() => readAppConfig({ LOG_LEVEL: "loud" })).toThrow(
      /LOG_LEVEL must be one of/
    );
  });
});
