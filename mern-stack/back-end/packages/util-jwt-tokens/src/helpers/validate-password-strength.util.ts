import {
  MIN_PASSWORD_LENGTH,
  REGEX_LOWERCASE,
  REGEX_UPPERCASE,
  REGEX_DIGIT,
} from "../constants.js";
import type { PasswordStrengthResult } from "../types.js";

/** Validates password meets strength rules (length, lowercase, uppercase, digit). */
const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const issues: string[] = [];
  if (typeof password !== "string") {
    return { valid: false, issues: ["Password must be a string"] };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!REGEX_LOWERCASE.test(password)) {
    issues.push("Password must contain at least one lowercase letter");
  }
  if (!REGEX_UPPERCASE.test(password)) {
    issues.push("Password must contain at least one uppercase letter");
  }
  if (!REGEX_DIGIT.test(password)) {
    issues.push("Password must contain at least one digit");
  }
  return {
    valid: issues.length === 0,
    score: issues.length === 0 ? 1 : 0,
    issues: issues.length > 0 ? issues : undefined,
  };
};

export { validatePasswordStrength };
