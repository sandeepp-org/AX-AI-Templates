// Converts a non-Error value to a human-readable string for serialization.
const formatNonErrorMessage = (err: unknown): string => {
  const isStringOrPrimitive =
    err === null ||
    err === undefined ||
    typeof err === "string" ||
    typeof err === "number" ||
    typeof err === "boolean";

  return isStringOrPrimitive ? String(err) : JSON.stringify(err);
};

// Converts any thrown value into a plain object with message, name, and stack fields.
const serializeError = (err: unknown): Record<string, unknown> => {
  const isError = err instanceof Error;
  const serialized: Record<string, unknown> = {
    message: isError ? err.message : formatNonErrorMessage(err),
    name: isError ? err.name : "UnknownError",
    stack: isError ? err.stack : undefined,
  };

  if (isError) {
    for (const key of Object.keys(err)) {
      serialized[key] = (err as unknown as Record<string, unknown>)[key];
    }
  }

  return serialized;
};

export { serializeError };
