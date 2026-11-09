import { RECENCY_WINDOW_MS } from "../constants.js";
import type { MemoryEntry } from "../types.js";

/**
 * Computes a score from importance and recency for result ranking.
 */
const computeMemoryScore = (entry: MemoryEntry, nowMs: number): number => {
  const ageMs = Math.max(0, nowMs - entry.updatedAtMs);
  const recency = Math.max(0, 1 - ageMs / RECENCY_WINDOW_MS);
  return entry.importance * 0.7 + recency * 0.3;
};

export { computeMemoryScore };
