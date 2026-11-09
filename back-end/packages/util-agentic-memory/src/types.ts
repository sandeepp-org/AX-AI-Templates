import type { MongoDb } from "@util/mongodb";

type MemoryJson = Record<string, unknown>;

enum MemoryType {
  PREFERENCE = "preference",
  RULE = "rule",
  FACT = "fact",
  CONTEXT = "context",
}

type MemoryEntry = {
  id?: string;
  memoryKey?: string;
  agentId: string;
  type: MemoryType;
  importance: number;
  payloadJson: MemoryJson;
  searchText: string;
  schemaVersion: number;
  documentVersion: number;
  createdAtMs: number;
  updatedAtMs: number;
  expiresAtMs?: number;
};

type SaveMemoryInput = {
  memoryKey?: string;
  agentId: string;
  type: MemoryType;
  importance?: number;
  payloadJson: MemoryJson;
  ttlMs?: number;
  expectedDocumentVersion?: number;
};

type RetrieveMemoryInput = {
  agentId: string;
  query?: string;
  types?: MemoryType[];
  topK?: number;
};

type DeleteMemoryInput = {
  agentId: string;
  id: string;
};

type UpsertOptions = {
  expectedDocumentVersion?: number;
};

type MemoryHooks = {
  beforeSave?: (entry: MemoryEntry) => MemoryEntry;
  afterSave?: (entry: MemoryEntry) => void;
  beforeRetrieve?: (input: RetrieveMemoryInput) => RetrieveMemoryInput;
  afterRetrieve?: (entries: MemoryEntry[]) => MemoryEntry[];
};

/**
 * Use when the app already created `MongoDb` (e.g. after startup `connect()`).
 * The adapter does not call `MongoDb.create` and does not close that client in `close()`.
 */
type MongoAdapterInjectedConfig = {
  mongoDb: MongoDb;
  collection?: string;
};

/**
 * Create or join the process `MongoDb` singleton from URI (default integration path).
 */
type MongoAdapterUriConfig = {
  uri: string;
  database: string;
  collection?: string;
  connectTimeoutMs?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
  /**
   * When true, `MemoryStoreAdapter.close()` disconnects the shared `MongoDb` singleton.
   * Default false so multiple services can share one process-wide connection.
   */
  closeConnectionOnClose?: boolean;
};

type MongoAdapterConfig = MongoAdapterInjectedConfig | MongoAdapterUriConfig;

type AgenticMemoryConfig = {
  mongo?: MongoAdapterConfig;
  adapter?: import("./interfaces.js").MemoryStoreAdapter;
  hooks?: MemoryHooks;
};

enum CommitPolicyMode {
  AUTO = "auto",
  ASK = "ask",
  NEVER = "never",
}

type CommitPolicy = {
  mode: CommitPolicyMode;
  reason?: string;
  updatedAtMs: number;
};

type CommitDecision = {
  action: "commit" | "ask" | "skip";
  policy: CommitPolicy;
};

export { MemoryType, CommitPolicyMode };

export type {
  MemoryJson,
  MemoryEntry,
  SaveMemoryInput,
  RetrieveMemoryInput,
  DeleteMemoryInput,
  UpsertOptions,
  MemoryHooks,
  MongoAdapterConfig,
  MongoAdapterInjectedConfig,
  MongoAdapterUriConfig,
  AgenticMemoryConfig,
  CommitPolicy,
  CommitDecision,
};
