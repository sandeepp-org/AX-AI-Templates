import type {
  DeleteMemoryInput,
  MemoryEntry,
  RetrieveMemoryInput,
  SaveMemoryInput,
  UpsertOptions,
} from "./types.js";

/**
 * Storage adapter contract for agent memory persistence.
 */
interface MemoryStoreAdapter {
  upsert(entry: MemoryEntry, options?: UpsertOptions): Promise<MemoryEntry>;
  delete(input: DeleteMemoryInput): Promise<void>;
  retrieve(input: RetrieveMemoryInput): Promise<MemoryEntry[]>;
  close?(): Promise<void>;
}

/**
 * Public contract for AgenticMemory service.
 */
interface AgenticMemoryContract {
  saveMemory(input: SaveMemoryInput): Promise<MemoryEntry>;
  retrieveMemory(input: RetrieveMemoryInput): Promise<MemoryEntry[]>;
  deleteMemory(input: DeleteMemoryInput): Promise<void>;
  close(): Promise<void>;
}

export type { MemoryStoreAdapter, AgenticMemoryContract };
