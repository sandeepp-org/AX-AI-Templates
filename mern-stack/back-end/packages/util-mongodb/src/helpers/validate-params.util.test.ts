import type { Logger } from "@util/logger";
import { z } from "zod";

import {
  validateWithSchema,
  validateManyWithSchema,
} from "./validate-params.util.js";
import { MongoDbValidationError } from "../errors.js";

const noop = (): void => {};
const mockLogger = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  child: () => mockLogger,
  close: () => Promise.resolve(),
} as unknown as Logger;

const buildContext = (operation: string) => ({
  collection: "test_collection",
  operation,
  logger: mockLogger,
});

describe("validateWithSchema", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it("should return parsed data when input is valid", () => {
    const input = { name: "Alice", age: 30 };
    const result = validateWithSchema(input, schema, buildContext("createOne"));
    expect(result).toEqual(input);
  });

  it("should throw MongoDbValidationError with correct fields when input is invalid", () => {
    const input = { name: "", age: -5 };
    let error: MongoDbValidationError | null = null;

    try {
      validateWithSchema(input, schema, buildContext("createOne"));
    } catch (err) {
      error = err as MongoDbValidationError;
    }

    expect(error).toBeInstanceOf(MongoDbValidationError);
    expect(error!.collection).toBe("test_collection");
    expect(error!.operation).toBe("createOne");
    expect(error!.issues.length).toBeGreaterThan(0);
  });
});

describe("validateManyWithSchema", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("should return validated array when all valid", () => {
    const input = [{ name: "Alice" }, { name: "Bob" }];
    const result = validateManyWithSchema(
      input,
      schema,
      buildContext("createMany")
    );
    expect(result).toEqual(input);
  });

  it("should throw MongoDbValidationError with path including index when one invalid", () => {
    const input = [{ name: "Alice" }, { name: "" }];
    let error: MongoDbValidationError | null = null;

    try {
      validateManyWithSchema(input, schema, buildContext("createMany"));
    } catch (err) {
      error = err as MongoDbValidationError;
    }

    expect(error).toBeInstanceOf(MongoDbValidationError);
    expect(error!.issues.length).toBeGreaterThan(0);
  });
});
