import { validatePasswordStrength } from "./validate-password-strength.util.js";

describe("validate-password-strength", () => {
  // test to return valid for strong password
  it("should return valid for strong password", () => {
    const result = validatePasswordStrength("SecurePass1");
    expect(result.valid).toBe(true);
    expect(result.issues).toBeUndefined();
  });

  // test to return invalid for short password
  it("should return invalid for short password", () => {
    const result = validatePasswordStrength("Ab1");
    expect(result.valid).toBe(false);
    expect(result.issues).toBeDefined();
  });

  // test to return invalid when missing digit
  it("should return invalid when missing digit", () => {
    const result = validatePasswordStrength("SecurePassword");
    expect(result.valid).toBe(false);
  });

  // test to return invalid when missing uppercase
  it("should return invalid when missing uppercase", () => {
    const result = validatePasswordStrength("securepass1");
    expect(result.valid).toBe(false);
  });

  // test to return invalid when missing lowercase
  it("should return invalid when missing lowercase", () => {
    const result = validatePasswordStrength("SECUREPASS1");
    expect(result.valid).toBe(false);
  });

  // test to return invalid with specific issues for short password
  it("should return invalid with specific issues for short password", () => {
    const result = validatePasswordStrength("Ab1");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("Password must be at least 8 characters");
  });

  // test to return invalid for empty string
  it("should return invalid for empty string", () => {
    const result = validatePasswordStrength("");
    expect(result.valid).toBe(false);
    expect(result.issues).toBeDefined();
    expect(result.issues).toContain("Password must be at least 8 characters");
  });
});
