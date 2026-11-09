import { z } from "zod";
import {
  scoreStringSimilarity,
  evalKeywordPresence,
  evalJsonSchema,
} from "./evaluate.util.js";

describe("scoreStringSimilarity", () => {
  it("returns 1.0 for identical strings", () => {
    expect(scoreStringSimilarity("hello world", "hello world")).toBe(1);
  });

  it("returns 0 for empty output vs non-empty reference", () => {
    expect(scoreStringSimilarity("", "reference")).toBe(0);
  });

  it("returns 0 for non-empty output vs empty reference", () => {
    expect(scoreStringSimilarity("output", "")).toBe(0);
  });

  it("returns a value < 0.5 for completely different strings", () => {
    const score = scoreStringSimilarity("abc", "xyz");
    expect(score).toBeLessThan(0.5);
  });

  it("returns a value in (0, 1) for partially similar strings", () => {
    const score = scoreStringSimilarity("hello world", "hello earth");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("returns 1.0 when both strings are empty", () => {
    expect(scoreStringSimilarity("", "")).toBe(1);
  });
});

describe("evalKeywordPresence", () => {
  it("returns score 1 and label pass when all keywords present", () => {
    const result = evalKeywordPresence("The quick brown fox jumps", [
      "quick",
      "fox",
    ]);
    expect(result.score).toBe(1);
    expect(result.label).toBe("pass");
  });

  it("returns score 0 and label fail when no keywords present", () => {
    const result = evalKeywordPresence("The quick brown fox jumps", [
      "elephant",
      "castle",
    ]);
    expect(result.score).toBe(0);
    expect(result.label).toBe("fail");
  });

  it("returns partial score for partial match", () => {
    const result = evalKeywordPresence("The quick fox", ["quick", "elephant"]);
    expect(result.score).toBe(0.5);
    expect(result.label).toBe("fail");
  });

  it("is case-insensitive", () => {
    const result = evalKeywordPresence("Hello World", ["hello", "WORLD"]);
    expect(result.score).toBe(1);
    expect(result.label).toBe("pass");
  });

  it("returns score 1 and pass for empty keywords list", () => {
    const result = evalKeywordPresence("anything", []);
    expect(result.score).toBe(1);
    expect(result.label).toBe("pass");
  });

  it("includes missing keywords in comment", () => {
    const result = evalKeywordPresence("only quick here", [
      "quick",
      "missing-word",
    ]);
    expect(result.comment).toContain("missing-word");
  });
});

describe("evalJsonSchema", () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  it("returns score 1 for valid JSON matching schema", () => {
    const result = evalJsonSchema(
      JSON.stringify({ name: "Alice", age: 30 }),
      schema
    );
    expect(result.score).toBe(1);
    expect(result.label).toBe("pass");
  });

  it("returns score 0 for invalid JSON", () => {
    const result = evalJsonSchema("not json at all", schema);
    expect(result.score).toBe(0);
    expect(result.label).toBe("fail");
    expect(result.comment).toContain("JSON parse error");
  });

  it("returns score 0 for valid JSON that fails schema validation", () => {
    const result = evalJsonSchema(JSON.stringify({ name: "Bob" }), schema);
    expect(result.score).toBe(0);
    expect(result.label).toBe("fail");
    expect(result.comment).toContain("Schema validation failed");
  });

  it("returns score 0 for wrong type in schema", () => {
    const result = evalJsonSchema(
      JSON.stringify({ name: 123, age: 30 }),
      schema
    );
    expect(result.score).toBe(0);
    expect(result.label).toBe("fail");
  });
});
