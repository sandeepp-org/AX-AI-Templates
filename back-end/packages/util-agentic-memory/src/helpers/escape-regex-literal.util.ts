/**
 * Escapes a user-controlled string for safe use as a MongoDB regex literal.
 */
const escapeRegexLiteral = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export { escapeRegexLiteral };
