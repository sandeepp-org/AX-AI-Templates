import { InternalError, ValidationError } from "../errors.js";
import { normalizeError, isAppError } from "./normalize-error.util.js";

describe("normalizeError", () => {
  it("should normalize BaseAppError instances preserving code, message, status, and details", () => {
    const details = { field: "email" };
    const error = new ValidationError("Invalid email", details);

    const normalized = normalizeError(error, { traceId: "req-1" });

    expect(normalized.code).toBe("VALIDATION_ERROR");
    expect(normalized.message).toBe("Invalid email");
    expect(normalized.status).toBe(400);
    expect(normalized.details).toEqual(details);
    expect(normalized.traceId).toBe("req-1");
  });

  it("should normalize generic Error instances with default code and status", () => {
    const error = new Error("Something went wrong");

    const normalized = normalizeError(error);

    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.message).toBe("Something went wrong");
    expect(normalized.status).toBe(500);
  });

  it("should normalize string errors using the string as message", () => {
    const normalized = normalizeError("Plain error");

    expect(normalized.message).toBe("Plain error");
    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.status).toBe(500);
  });

  it("should normalize object errors as details", () => {
    const value = { error: "value" };

    const normalized = normalizeError(value);

    expect(normalized.details).toEqual(value);
    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.status).toBe(500);
  });

  it("should include stack when includeStack is true and error has a stack", () => {
    const error = new InternalError("Unexpected");

    const normalized = normalizeError(error, { includeStack: true });

    expect(normalized.stack).toBeDefined();
  });

  it("should return default shape when error is null", () => {
    const normalized = normalizeError(null);

    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.message).toBe("An unexpected error occurred.");
    expect(normalized.status).toBe(500);
  });

  it("should return default shape when error is undefined", () => {
    const normalized = normalizeError(undefined);

    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.message).toBe("An unexpected error occurred.");
    expect(normalized.status).toBe(500);
  });

  it("should apply mapDetails to transform object error payload", () => {
    const raw = { foo: 1, bar: 2 };
    const mapDetails = (input: unknown) => ({
      mapped: true,
      original: input,
    });

    const normalized = normalizeError(raw, { mapDetails });

    expect(normalized.details).toEqual({ mapped: true, original: raw });
  });
});

describe("isAppError", () => {
  it("should return true for BaseAppError instances", () => {
    const error = new ValidationError("Invalid");

    const result = isAppError(error);

    expect(result).toBe(true);
  });

  it("should return false for non-BaseAppError instances", () => {
    const error = new Error("Generic");

    const result = isAppError(error);

    expect(result).toBe(false);
  });
});
