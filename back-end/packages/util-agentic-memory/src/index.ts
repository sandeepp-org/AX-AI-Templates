import { AgenticMemory } from "./agentic-memory.js";
import { MongoMemoryStoreAdapter } from "./adapters/mongo-memory-store.adapter.js";
import {
  AgenticMemoryNotInitializedError,
  MemoryToolValidationError,
  MemoryVersionConflictError,
  MongoMemorySingletonConflictError,
} from "./errors.js";
import { CommitPolicyMode, MemoryType } from "./types.js";
import { decideCommit, setCommitPolicy } from "./policy/commit-policy.js";
import {
  createMemoryTools,
  toolDeleteMemory,
  toolRetrieveMemory,
  toolSaveMemory,
} from "./tools/memory-tools.js";

import type {
  AgenticMemoryContract,
  MemoryStoreAdapter,
} from "./interfaces.js";
import type {
  AgenticMemoryConfig,
  CommitDecision,
  CommitPolicy,
  DeleteMemoryInput,
  MemoryEntry,
  MemoryHooks,
  MemoryJson,
  MongoAdapterConfig,
  MongoAdapterInjectedConfig,
  MongoAdapterUriConfig,
  RetrieveMemoryInput,
  SaveMemoryInput,
  UpsertOptions,
} from "./types.js";

export {
  AgenticMemory,
  MongoMemoryStoreAdapter,
  AgenticMemoryNotInitializedError,
  MemoryToolValidationError,
  MemoryVersionConflictError,
  MongoMemorySingletonConflictError,
  MemoryType,
  CommitPolicyMode,
  setCommitPolicy,
  decideCommit,
  toolSaveMemory,
  toolRetrieveMemory,
  toolDeleteMemory,
  createMemoryTools,
};

export type {
  AgenticMemoryContract,
  MemoryStoreAdapter,
  AgenticMemoryConfig,
  CommitDecision,
  CommitPolicy,
  DeleteMemoryInput,
  MemoryEntry,
  MemoryHooks,
  MemoryJson,
  MongoAdapterConfig,
  MongoAdapterInjectedConfig,
  MongoAdapterUriConfig,
  RetrieveMemoryInput,
  SaveMemoryInput,
  UpsertOptions,
};
