import {
  DEFAULT_IMPORTANCE,
  DEFAULT_SCHEMA_VERSION,
  DEFAULT_TOP_K,
} from "./constants.js";
import { AgenticMemoryNotInitializedError } from "./errors.js";
import type {
  AgenticMemoryContract,
  MemoryStoreAdapter,
} from "./interfaces.js";
import { buildMemorySearchText } from "./helpers/build-search-text.util.js";
import { MongoMemoryStoreAdapter } from "./adapters/mongo-memory-store.adapter.js";
import type {
  AgenticMemoryConfig,
  DeleteMemoryInput,
  MemoryEntry,
  RetrieveMemoryInput,
  SaveMemoryInput,
} from "./types.js";

class AgenticMemory implements AgenticMemoryContract {
  static #instance: AgenticMemory | null = null;

  #adapter: MemoryStoreAdapter;

  #hooks: NonNullable<AgenticMemoryConfig["hooks"]>;

  private constructor(
    adapter: MemoryStoreAdapter,
    hooks?: AgenticMemoryConfig["hooks"]
  ) {
    this.#adapter = adapter;
    this.#hooks = {
      beforeSave: hooks?.beforeSave,
      afterSave: hooks?.afterSave,
      beforeRetrieve: hooks?.beforeRetrieve,
      afterRetrieve: hooks?.afterRetrieve,
    };
  }

  /**
   * Creates and stores the singleton memory service.
   */
  static create = (config: AgenticMemoryConfig): AgenticMemory => {
    const adapter =
      config.adapter ??
      (config.mongo !== undefined
        ? new MongoMemoryStoreAdapter(config.mongo)
        : null);
    if (adapter === null) {
      throw new Error(
        "AgenticMemory.create requires either `adapter` or `mongo` config."
      );
    }
    const instance = new AgenticMemory(adapter, config.hooks);
    AgenticMemory.#instance = instance;
    return instance;
  };

  /**
   * Returns the initialized singleton instance.
   */
  static getInstance = (): AgenticMemory => {
    if (AgenticMemory.#instance === null) {
      throw new AgenticMemoryNotInitializedError();
    }
    return AgenticMemory.#instance;
  };

  /**
   * Saves or updates a memory entry.
   */
  saveMemory = async (input: SaveMemoryInput): Promise<MemoryEntry> => {
    const nowMs = Date.now();
    const entry: MemoryEntry = {
      memoryKey: input.memoryKey,
      agentId: input.agentId,
      type: input.type,
      importance: input.importance ?? DEFAULT_IMPORTANCE,
      payloadJson: input.payloadJson,
      searchText: buildMemorySearchText(input.payloadJson, input.memoryKey),
      schemaVersion: DEFAULT_SCHEMA_VERSION,
      documentVersion: 0,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      expiresAtMs:
        input.ttlMs !== undefined && input.ttlMs > 0
          ? nowMs + input.ttlMs
          : undefined,
    };
    const beforeSave = this.#hooks.beforeSave?.(entry) ?? entry;
    const saved = await this.#adapter.upsert(beforeSave, {
      expectedDocumentVersion: input.expectedDocumentVersion,
    });
    this.#hooks.afterSave?.(saved);
    return saved;
  };

  /**
   * Retrieves ranked memories for an agent.
   */
  retrieveMemory = async (
    input: RetrieveMemoryInput
  ): Promise<MemoryEntry[]> => {
    const normalized: RetrieveMemoryInput = {
      topK: input.topK ?? DEFAULT_TOP_K,
      query: input.query,
      types: input.types,
      agentId: input.agentId,
    };
    const beforeRetrieve =
      this.#hooks.beforeRetrieve?.(normalized) ?? normalized;
    const found = await this.#adapter.retrieve(beforeRetrieve);
    return this.#hooks.afterRetrieve?.(found) ?? found;
  };

  /**
   * Deletes a memory entry by id.
   */
  deleteMemory = async (input: DeleteMemoryInput): Promise<void> => {
    await this.#adapter.delete(input);
  };

  /**
   * Closes resources and clears singleton.
   */
  close = async (): Promise<void> => {
    if (AgenticMemory.#instance === this) {
      AgenticMemory.#instance = null;
    }
    if (this.#adapter.close !== undefined) {
      await this.#adapter.close();
    }
  };
}

export { AgenticMemory };
