import { MEMORY_KEY_COMMIT_POLICY } from "../constants.js";
import type { AgenticMemory } from "../agentic-memory.js";
import { CommitPolicyMode, MemoryType } from "../types.js";
import type { CommitDecision, CommitPolicy } from "../types.js";

/**
 * Builds a normalized commit policy value.
 */
const buildCommitPolicy = (
  mode: CommitPolicyMode,
  reason?: string
): CommitPolicy => {
  return {
    mode,
    reason,
    updatedAtMs: Date.now(),
  };
};

/**
 * Stores commit policy under a stable memory key.
 */
const setCommitPolicy = async (
  service: AgenticMemory,
  input: { agentId: string; mode: CommitPolicyMode; reason?: string }
): Promise<CommitPolicy> => {
  const policy = buildCommitPolicy(input.mode, input.reason);
  await service.saveMemory({
    agentId: input.agentId,
    memoryKey: MEMORY_KEY_COMMIT_POLICY,
    type: MemoryType.RULE,
    importance: 10,
    payloadJson: policy as unknown as Record<string, unknown>,
  });
  return policy;
};

/**
 * Decides commit action from stored policy or default mode.
 */
const decideCommit = async (
  service: AgenticMemory,
  input: { agentId: string; defaultMode?: CommitPolicyMode }
): Promise<CommitDecision> => {
  const memories = await service.retrieveMemory({
    agentId: input.agentId,
    query: MEMORY_KEY_COMMIT_POLICY,
    types: [MemoryType.RULE],
    topK: 10,
  });
  const match = memories.find(
    (memory) => memory.memoryKey === MEMORY_KEY_COMMIT_POLICY
  );
  const mode =
    (match?.payloadJson.mode as CommitPolicyMode | undefined) ??
    input.defaultMode ??
    CommitPolicyMode.AUTO;
  const policy: CommitPolicy = {
    mode,
    reason:
      typeof match?.payloadJson.reason === "string"
        ? (match.payloadJson.reason as string)
        : undefined,
    updatedAtMs:
      typeof match?.payloadJson.updatedAtMs === "number"
        ? (match.payloadJson.updatedAtMs as number)
        : Date.now(),
  };

  if (mode === CommitPolicyMode.ASK) {
    return { action: "ask", policy };
  }
  if (mode === CommitPolicyMode.NEVER) {
    return { action: "skip", policy };
  }
  return { action: "commit", policy };
};

export { setCommitPolicy, decideCommit };
