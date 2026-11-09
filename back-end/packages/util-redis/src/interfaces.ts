import type {
  RedisClientAdapter,
  RedisConfig,
  RevokeByPrefixInput,
  SetRecordInput,
  StoredRecord,
} from "./types.js";

/**
 * Public instance API for the Redis connection manager.
 * Replace the `Redis` implementation while keeping this shape so callers and `RecordStore` stay compatible.
 */
interface IRedis {
  connect(): Promise<void>;
  isConnected(): boolean;
  close(): Promise<void>;
  withOperation<T>(fn: () => Promise<T>): Promise<T>;
  getClient(): Promise<RedisClientAdapter>;
  buildRecordKey(key: string): string;
  buildRecordKeyPrefix(keyPrefix: string): string;
}

/**
 * Singleton factory surface for `Redis` (what apps import as `Redis.create` / `Redis.getInstance`).
 */
interface IRedisModule {
  create(config: RedisConfig): IRedis;
  getInstance(): IRedis;
}

/**
 * Public static API for typed record storage.
 * A future implementation must expose these four operations with the same signatures.
 */
interface IRecordStoreStatic {
  setRecord<TValue>(input: SetRecordInput<TValue>): Promise<void>;
  getRecord<TValue = unknown>(
    key: string
  ): Promise<StoredRecord<TValue> | null>;
  consumeRecord<TValue = unknown>(
    key: string
  ): Promise<StoredRecord<TValue> | null>;
  revokeRecord(key: string): Promise<void>;
  revokeByPrefix(input: RevokeByPrefixInput): Promise<number>;
}

export type { IRedis, IRedisModule, IRecordStoreStatic };
