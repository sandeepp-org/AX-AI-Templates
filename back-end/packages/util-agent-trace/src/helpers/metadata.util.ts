import { STRING_ATTRIBUTE_MAX_LENGTH } from "../constants.js";
import type { SpanAttributes } from "../types.js";

/**
 * Flattens a nested object into dot-notation keys safe for OTel span attributes.
 * e.g. { user: { id: "123" } } → { "user.id": "123" }
 */
const flattenAttributes = (
  obj: Record<string, unknown>,
  prefix?: string
): SpanAttributes => {
  const result: SpanAttributes = {};

  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenAttributes(
        value as Record<string, unknown>,
        flatKey
      );
      Object.assign(result, nested);
    } else if (Array.isArray(value)) {
      result[flatKey] = JSON.stringify(value);
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[flatKey] = value;
    } else {
      result[flatKey] = String(value);
    }
  }

  return result;
};

/**
 * Strips values for keys matching any of the provided patterns.
 * Matching keys have their value replaced with "[Redacted]".
 */
const redactAttributes = (
  attrs: SpanAttributes,
  redactKeys: Array<string | RegExp>
): SpanAttributes => {
  const result: SpanAttributes = {};

  for (const [key, value] of Object.entries(attrs)) {
    const shouldRedact = redactKeys.some((pattern) =>
      typeof pattern === "string" ? pattern === key : pattern.test(key)
    );
    result[key] = shouldRedact ? "[Redacted]" : value;
  }

  return result;
};

/**
 * Truncates string attribute values exceeding maxLength.
 * Number and boolean values are passed through unchanged.
 */
const truncateStringAttributes = (
  attrs: SpanAttributes,
  maxLength: number = STRING_ATTRIBUTE_MAX_LENGTH
): SpanAttributes => {
  const result: SpanAttributes = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "string" && value.length > maxLength) {
      result[key] = value.slice(0, maxLength);
    } else {
      result[key] = value;
    }
  }

  return result;
};

export { flattenAttributes, redactAttributes, truncateStringAttributes };
