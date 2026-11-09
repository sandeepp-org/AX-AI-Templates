import { escapeRegexLiteral } from "./escape-regex-literal.util.js";

describe("escapeRegexLiteral", () => {
  it("should escape regex metacharacters", () => {
    expect(escapeRegexLiteral("a+b")).toBe("a\\+b");
    expect(escapeRegexLiteral("file.txt")).toBe("file\\.txt");
  });
});
