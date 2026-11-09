import { validateEmail } from "./validate-email.util.js";

describe("validate-email", () => {
  it("should return valid for correct email", () => {
    const result = validateEmail("user@example.com");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return invalid for empty string", () => {
    const result = validateEmail("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return invalid for invalid format", () => {
    const result = validateEmail("not-an-email");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return invalid for string with only spaces", () => {
    const result = validateEmail("   ");
    expect(result.valid).toBe(false);
  });
});
