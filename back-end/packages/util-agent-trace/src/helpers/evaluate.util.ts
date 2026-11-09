import type { ZodType } from "zod";
import type { EvalResult } from "../types.js";

/**
 * Computes normalized Levenshtein distance similarity score between two strings.
 * Returns a value in [0, 1] where 1.0 = identical.
 */
const scoreStringSimilarity = (output: string, reference: string): number => {
  if (output === reference) return 1;
  if (output.length === 0 || reference.length === 0) return 0;

  const m = output.length;
  const n = reference.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (output[i - 1] === reference[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const maxLen = Math.max(m, n);
  return 1 - dp[m][n] / maxLen;
};

/**
 * Evaluates whether an LLM output contains all required keywords.
 * Score is the proportion of keywords found; label is "pass" if all found, else "fail".
 */
const evalKeywordPresence = (
  output: string,
  keywords: string[]
): EvalResult => {
  if (keywords.length === 0) {
    return { score: 1, label: "pass", comment: "No keywords to check" };
  }

  const lowerOutput = output.toLowerCase();
  const found = keywords.filter((kw) => lowerOutput.includes(kw.toLowerCase()));
  const score = found.length / keywords.length;
  const label = score === 1 ? "pass" : "fail";
  const missing = keywords.filter(
    (kw) => !lowerOutput.includes(kw.toLowerCase())
  );
  const comment =
    missing.length > 0
      ? `Missing keywords: ${missing.join(", ")}`
      : "All keywords present";

  return { score, label, comment };
};

/**
 * Evaluates whether an LLM output is valid JSON conforming to a Zod schema.
 * Returns score 1.0 on success, 0.0 on parse or validation failure.
 */
const evalJsonSchema = <T>(output: string, schema: ZodType<T>): EvalResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { score: 0, label: "fail", comment: `JSON parse error: ${msg}` };
  }

  const result = schema.safeParse(parsed);
  if (result.success) {
    return { score: 1, label: "pass", comment: "Schema validation passed" };
  }

  const issues = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return {
    score: 0,
    label: "fail",
    comment: `Schema validation failed: ${issues}`,
  };
};

export { scoreStringSimilarity, evalKeywordPresence, evalJsonSchema };
