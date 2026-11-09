import type { MemoryJson } from "../types.js";

/**
 * Flattens JSON values into a normalized lowercase search string.
 */
const flattenValue = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(flattenValue);
  }
  return [];
};

/**
 * Builds deterministic searchable text from a memory payload.
 */
const buildSearchText = (payloadJson: MemoryJson): string => {
  const pieces = flattenValue(payloadJson)
    .map((text) => text.trim().toLowerCase())
    .filter((text) => text.length > 0);
  return pieces.join(" ");
};

/**
 * Search text for retrieve queries: payload values plus `memoryKey` so keys like `__policy.commit` match.
 */
const buildMemorySearchText = (
  payloadJson: MemoryJson,
  memoryKey?: string
): string => {
  const keyPart = memoryKey?.trim().toLowerCase() ?? "";
  const payloadPart = buildSearchText(payloadJson);
  return [keyPart, payloadPart].filter((s) => s.length > 0).join(" ");
};

export { buildSearchText, buildMemorySearchText };
