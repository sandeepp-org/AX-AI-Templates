import winston from "winston";

const REDACTED_VALUE = "[Redacted]";

/**
 * Builds a Winston format that replaces values at the given dot-separated paths with "[Redacted]".
 */
const buildRedactFormat = (
  paths: string[],
  baseFormat: winston.Logform.Format
): winston.Logform.Format => {
  const redactFormat = winston.format((info) => {
    for (const path of paths) {
      const keys = path.split(".");
      let obj: Record<string, unknown> = info;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        const isTraversable = obj && typeof obj[k] === "object";
        if (isTraversable) {
          obj = obj[k] as Record<string, unknown>;
        }
      }

      const last = keys[keys.length - 1];
      const hasKey = obj && last in obj;
      if (hasKey) {
        obj[last] = REDACTED_VALUE;
      }
    }

    return info;
  })();

  const combined = winston.format.combine(redactFormat, baseFormat);

  return combined;
};

export { buildRedactFormat, REDACTED_VALUE };
