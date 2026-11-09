import {
  estimateTokenCount,
  mergeTokenUsage,
  assertValidTokenUsage,
} from "./token.util.js";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(estimateTokenCount("   ")).toBe(0);
  });

  it("returns positive integer for a single word", () => {
    const count = estimateTokenCount("hello");
    expect(count).toBeGreaterThan(0);
    expect(Number.isInteger(count)).toBe(true);
  });

  it("returns a larger estimate for longer text", () => {
    const short = estimateTokenCount("hello world");
    const long = estimateTokenCount(
      "hello world this is a much longer sentence with many more words"
    );
    expect(long).toBeGreaterThan(short);
  });

  it("handles multi-line text", () => {
    const count = estimateTokenCount("line one\nline two\nline three");
    expect(count).toBeGreaterThan(0);
  });
});

describe("mergeTokenUsage", () => {
  it("merges two partial usages summing tokens when totalTokens not in b", () => {
    const result = mergeTokenUsage(
      { inputTokens: 10, outputTokens: 5 },
      { inputTokens: 20, outputTokens: 8 }
    );
    expect(result.inputTokens).toBe(20);
    expect(result.outputTokens).toBe(8);
    expect(result.totalTokens).toBe(28);
  });

  it("uses explicit totalTokens from b when provided", () => {
    const result = mergeTokenUsage(
      { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      { totalTokens: 99 }
    );
    expect(result.totalTokens).toBe(99);
  });

  it("preserves a values when b fields are undefined", () => {
    const result = mergeTokenUsage(
      { inputTokens: 7, outputTokens: 3, totalTokens: 10 },
      {}
    );
    expect(result.inputTokens).toBe(7);
    expect(result.outputTokens).toBe(3);
    expect(result.totalTokens).toBe(10);
  });

  it("computes totalTokens when only inputTokens is set", () => {
    const result = mergeTokenUsage({ inputTokens: 5 }, { outputTokens: 10 });
    expect(result.totalTokens).toBe(15);
  });
});

describe("assertValidTokenUsage", () => {
  it("does not throw for valid usage", () => {
    expect(() =>
      assertValidTokenUsage({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      })
    ).not.toThrow();
  });

  it("does not throw for empty usage", () => {
    expect(() => assertValidTokenUsage({})).not.toThrow();
  });

  it("throws RangeError for negative inputTokens", () => {
    expect(() => assertValidTokenUsage({ inputTokens: -1 })).toThrow(
      RangeError
    );
  });

  it("throws RangeError for negative outputTokens", () => {
    expect(() => assertValidTokenUsage({ outputTokens: -5 })).toThrow(
      RangeError
    );
  });

  it("throws RangeError for negative totalTokens", () => {
    expect(() => assertValidTokenUsage({ totalTokens: -100 })).toThrow(
      RangeError
    );
  });

  it("allows zero values", () => {
    expect(() =>
      assertValidTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 })
    ).not.toThrow();
  });
});
