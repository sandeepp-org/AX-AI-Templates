type RedisClientAdapter = {
  isOpen: boolean;
  connect: () => Promise<void>;
  quit: () => Promise<void>;

  get: (key: string) => Promise<string | null>;
  getDel: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options: { PX: number }
  ) => Promise<unknown>;
  del: (keys: string | string[]) => Promise<number>;
  scanIterator: (options: {
    MATCH: string;
    COUNT: number;
  }) => AsyncIterable<string>;
  xAdd: (key: string, id: string, fields: string[]) => Promise<string>;
  xRange: (
    key: string,
    start: string,
    end: string
  ) => Promise<[string, string[]][]>;
};

type RedisConfig = {
  /**
   * Redis connection string, e.g. `redis://localhost:6379`.
   */
  url: string;

  /**
   * Namespace prefix applied to all keys.
   */
  keyPrefix?: string;

  /**
   * Logical record namespace (keeps different record families separated).
   */
  recordNamespace?: string;

  /**
   * Default TTL (in milliseconds) used when `setRecord` does not specify one.
   */
  defaultRecordTtlMs?: number;

  /**
   * Retry configuration for operations like `get/set/del`.
   */
  maxRetryAttempts?: number;
  baseRetryDelayMs?: number;
};

type StoredRecord<TValue = unknown> = {
  value: TValue;
};

type SetRecordInput<TValue = unknown> = {
  /**
   * Caller-defined record key (will be namespaced by this package).
   * Example: `user-123:refresh-abc` or `user-123:session-xyz`.
   */
  key: string;

  record: StoredRecord<TValue> | TValue;

  /**
   * TTL in milliseconds.
   */
  ttlMs: number;
};

type RevokeByPrefixInput = {
  /**
   * Prefix applied after the package namespace, e.g. `user-123:`.
   */
  keyPrefix: string;
};

type RedisState = {
  client: RedisClientAdapter | null;
  config: RedisConfig;
};

export type {
  RedisConfig,
  RedisClientAdapter,
  StoredRecord,
  SetRecordInput,
  RevokeByPrefixInput,
  RedisState,
};
