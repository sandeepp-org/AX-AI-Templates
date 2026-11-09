import {
  flattenAttributes,
  redactAttributes,
  truncateStringAttributes,
} from "./metadata.util.js";

describe("flattenAttributes", () => {
  it("returns flat object unchanged", () => {
    const input = { foo: "bar", count: 42, flag: true };
    expect(flattenAttributes(input)).toEqual({
      foo: "bar",
      count: 42,
      flag: true,
    });
  });

  it("flattens 2-level nested object with dot notation", () => {
    const input = { user: { id: "abc", role: "admin" } };
    expect(flattenAttributes(input)).toEqual({
      "user.id": "abc",
      "user.role": "admin",
    });
  });

  it("flattens deeply nested object correctly", () => {
    const input = { a: { b: { c: "deep" } } };
    expect(flattenAttributes(input)).toEqual({ "a.b.c": "deep" });
  });

  it("converts array values to JSON string", () => {
    const input = { tags: ["x", "y"] };
    const result = flattenAttributes(input);
    expect(result["tags"]).toBe('["x","y"]');
  });

  it("applies prefix to all keys", () => {
    const input = { id: "1" };
    expect(flattenAttributes(input, "meta")).toEqual({ "meta.id": "1" });
  });

  it("converts non-primitive leaf values to string", () => {
    const input = { val: null } as unknown as Record<string, unknown>;
    const result = flattenAttributes(input);
    expect(typeof result["val"]).toBe("string");
  });
});

describe("redactAttributes", () => {
  it("replaces matched string key with [Redacted]", () => {
    const attrs = { apiKey: "secret", name: "john" };
    const result = redactAttributes(attrs, ["apiKey"]);
    expect(result["apiKey"]).toBe("[Redacted]");
    expect(result["name"]).toBe("john");
  });

  it("replaces keys matching RegExp", () => {
    const attrs = { "auth.token": "tok123", "auth.user": "alice", other: "ok" };
    const result = redactAttributes(attrs, [/^auth\./]);
    expect(result["auth.token"]).toBe("[Redacted]");
    expect(result["auth.user"]).toBe("[Redacted]");
    expect(result["other"]).toBe("ok");
  });

  it("leaves unmatched keys untouched", () => {
    const attrs = { a: "keep", b: "keep" };
    const result = redactAttributes(attrs, ["c"]);
    expect(result).toEqual({ a: "keep", b: "keep" });
  });

  it("handles empty redact list", () => {
    const attrs = { x: 1, y: 2 };
    expect(redactAttributes(attrs, [])).toEqual({ x: 1, y: 2 });
  });
});

describe("truncateStringAttributes", () => {
  it("truncates strings beyond maxLength", () => {
    const longValue = "a".repeat(2000);
    const attrs = { content: longValue };
    const result = truncateStringAttributes(attrs, 100);
    expect((result["content"] as string).length).toBe(100);
  });

  it("leaves strings within maxLength unchanged", () => {
    const attrs = { short: "hello" };
    const result = truncateStringAttributes(attrs, 100);
    expect(result["short"]).toBe("hello");
  });

  it("leaves number values unchanged", () => {
    const attrs = { count: 42 };
    expect(truncateStringAttributes(attrs)["count"]).toBe(42);
  });

  it("leaves boolean values unchanged", () => {
    const attrs = { flag: true };
    expect(truncateStringAttributes(attrs)["flag"]).toBe(true);
  });

  it("applies default maxLength of 1024", () => {
    const longValue = "x".repeat(2000);
    const attrs = { val: longValue };
    const result = truncateStringAttributes(attrs);
    expect((result["val"] as string).length).toBe(1024);
  });
});
