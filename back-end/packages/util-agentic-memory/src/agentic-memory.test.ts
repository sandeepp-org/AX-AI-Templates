import { AgenticMemory } from "./agentic-memory.js";
import {
  AgenticMemoryNotInitializedError,
  MemoryToolValidationError,
  MongoMemorySingletonConflictError,
} from "./errors.js";
import { decideCommit, setCommitPolicy } from "./policy/commit-policy.js";
import { toolSaveMemory } from "./tools/memory-tools.js";
import { CommitPolicyMode, MemoryType } from "./types.js";

/**
 * When `JEST_PACKAGE_ENV=util-agentic-memory`, Jest loads only `packages/util-agentic-memory/.env`.
 * URI: `MONGODB_URI` / `MONGO_URI`. Database: `AGENTIC_MEMORY_MONGODB_DATABASE`, else `MONGODB_DATABASE`, else `agentic_memory_test`.
 */
const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "";
const MONGODB_DATABASE =
  process.env.AGENTIC_MEMORY_MONGODB_DATABASE ??
  process.env.MONGODB_DATABASE ??
  "agentic_memory_test";

const describeIfMongo = MONGODB_URI.length > 0 ? describe : describe.skip;

describe("AgenticMemory lifecycle", () => {
  it("should throw when getInstance is called before create", () => {
    expect(() => AgenticMemory.getInstance()).toThrow(
      AgenticMemoryNotInitializedError
    );
  });
});

describeIfMongo("AgenticMemory with Mongo default adapter", () => {
  const agentId = "agent-memory-test";
  let service: AgenticMemory;

  beforeAll(() => {
    service = AgenticMemory.create({
      mongo: { uri: MONGODB_URI, database: MONGODB_DATABASE },
    });
  });

  afterAll(async () => {
    await service.close();
  });

  it("should save and retrieve memories within same agent partition", async () => {
    const memoryKey = "pref.language";
    const payloadJson = { language: "typescript" };
    await service.saveMemory({
      agentId,
      memoryKey,
      type: MemoryType.PREFERENCE,
      importance: 9,
      payloadJson,
    });

    const found = await service.retrieveMemory({
      agentId,
      query: "typescript",
      types: [MemoryType.PREFERENCE],
      topK: 5,
    });

    expect(found.length).toBeGreaterThan(0);
    expect(found[0]?.payloadJson.language).toBe(payloadJson.language);
  });

  it("should isolate memories between agents", async () => {
    const sourceAgentId = "agent-source";
    const otherAgentId = "agent-other";
    await service.saveMemory({
      agentId: sourceAgentId,
      memoryKey: "rule.commit",
      type: MemoryType.RULE,
      importance: 10,
      payloadJson: { message: "ask before commit" },
    });

    const found = await service.retrieveMemory({
      agentId: otherAgentId,
      query: "commit",
      types: [MemoryType.RULE],
      topK: 5,
    });

    expect(found).toHaveLength(0);
  });

  it("should enforce optimistic concurrency on stale expectedDocumentVersion", async () => {
    const memoryKey = "rule.review";
    const initial = await service.saveMemory({
      agentId,
      memoryKey,
      type: MemoryType.RULE,
      importance: 7,
      payloadJson: { review: true },
    });

    await service.saveMemory({
      agentId,
      memoryKey,
      type: MemoryType.RULE,
      importance: 8,
      payloadJson: { review: false },
      expectedDocumentVersion: initial.documentVersion,
    });

    await expect(
      service.saveMemory({
        agentId,
        memoryKey,
        type: MemoryType.RULE,
        importance: 8,
        payloadJson: { review: true },
        expectedDocumentVersion: initial.documentVersion,
      })
    ).rejects.toThrow();
  });

  it("should store and resolve commit policy decisions", async () => {
    await setCommitPolicy(service, {
      agentId,
      mode: CommitPolicyMode.ASK,
      reason: "Require confirmation",
    });

    const decision = await decideCommit(service, { agentId });

    expect(decision.action).toBe("ask");
    expect(decision.policy.mode).toBe(CommitPolicyMode.ASK);
  });

  it("should delete a memory by id", async () => {
    const deleteAgentId = "agent-memory-delete-test";
    const saved = await service.saveMemory({
      agentId: deleteAgentId,
      memoryKey: "delete.me",
      type: MemoryType.FACT,
      importance: 5,
      payloadJson: { token: "to-remove" },
    });
    await service.deleteMemory({ agentId: deleteAgentId, id: saved.id! });

    const found = await service.retrieveMemory({
      agentId: deleteAgentId,
      query: "to-remove",
      topK: 5,
    });
    expect(found.some((m) => m.id === saved.id)).toBe(false);
  });

  it("should rank higher-importance memories first for same agent", async () => {
    const rankAgentId = "agent-memory-rank-test";
    await service.saveMemory({
      agentId: rankAgentId,
      memoryKey: "rank.low",
      type: MemoryType.FACT,
      importance: 1,
      payloadJson: { label: "low" },
    });
    await service.saveMemory({
      agentId: rankAgentId,
      memoryKey: "rank.high",
      type: MemoryType.FACT,
      importance: 10,
      payloadJson: { label: "high" },
    });

    const found = await service.retrieveMemory({
      agentId: rankAgentId,
      topK: 1,
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.memoryKey).toBe("rank.high");
  });

  it("should throw MemoryToolValidationError for invalid tool payloads", async () => {
    await expect(toolSaveMemory(service, {})).rejects.toThrow(
      MemoryToolValidationError
    );
  });

  it("should reject a second Mongo config when a different database is already active", () => {
    expect(() =>
      AgenticMemory.create({
        mongo: {
          uri: MONGODB_URI,
          database: `${MONGODB_DATABASE}_conflict`,
        },
      })
    ).toThrow(MongoMemorySingletonConflictError);
  });

  it("should clear AgenticMemory singleton on close", async () => {
    expect(AgenticMemory.getInstance()).toBe(service);
    await service.close();
    expect(() => AgenticMemory.getInstance()).toThrow(
      AgenticMemoryNotInitializedError
    );
  });
});
