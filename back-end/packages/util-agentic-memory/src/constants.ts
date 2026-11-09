const DEFAULT_MEMORY_COLLECTION = "agent_memory_entries";
const DEFAULT_TOP_K = 5;
const DEFAULT_IMPORTANCE = 5;
const DEFAULT_SCHEMA_VERSION = 1;
const MEMORY_KEY_COMMIT_POLICY = "__policy.commit";

/** Half-life style window for ranking (importance vs recency). */
const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Caps retrieve substring length before regex (mitigates pathological input). */
const RETRIEVE_QUERY_MAX_LENGTH = 512;

/**
 * Candidate docs fetched before in-memory ranking: max(base, topK * multiplier).
 */
const RETRIEVE_CANDIDATE_LIMIT_BASE = 20;
const RETRIEVE_CANDIDATE_LIMIT_PER_TOPK = 10;

export {
  DEFAULT_MEMORY_COLLECTION,
  DEFAULT_TOP_K,
  DEFAULT_IMPORTANCE,
  DEFAULT_SCHEMA_VERSION,
  MEMORY_KEY_COMMIT_POLICY,
  RECENCY_WINDOW_MS,
  RETRIEVE_QUERY_MAX_LENGTH,
  RETRIEVE_CANDIDATE_LIMIT_BASE,
  RETRIEVE_CANDIDATE_LIMIT_PER_TOPK,
};
