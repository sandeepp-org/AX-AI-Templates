import { z } from "zod";
import { ValidationError } from "@util/error-normalizer";

/** Parses and validates unknown input against a Zod schema; throws ValidationError on failure. */
const parseInput = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new ValidationError(message, result.error.issues);
  }
  return result.data;
};

export { parseInput };
