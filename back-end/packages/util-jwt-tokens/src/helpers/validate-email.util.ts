import { EMAIL_REGEX } from "../constants.js";
import type { EmailValidationResult } from "../types.js";

/** Validates email format and returns result with optional error message. */
const validateEmail = (email: string): EmailValidationResult => {
  if (typeof email !== "string" || email.trim().length === 0) {
    return { valid: false, error: "Email is required" };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
};

export { validateEmail };
