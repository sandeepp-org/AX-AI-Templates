import { Redis } from "./redis.js";
import { RecordStoreError } from "./errors.js";
import { DEFAULT_SCAN_COUNT } from "./constants.js";
import type { IRecordStoreStatic } from "./interfaces.js";
import type {
  RevokeByPrefixInput,
  SetRecordInput,
  StoredRecord,
} from "./types.js";

/**
 * Normalizes record values into `{ value: ... }` shape.
 */
const normalizeRecord = <TValue>(
  record: StoredRecord<TValue> | TValue
): StoredRecord<TValue> => {
  if (record !== null && typeof record === "object" && "value" in record) {
    return record as StoredRecord<TValue>;
  }
  return { value: record as TValue };
};

/**
 * Normalizes (wraps) record values and serializes them for Redis.
 */
const serializeRecord = <TValue>(
  record: StoredRecord<TValue> | TValue
): string => {
  const normalized = normalizeRecord(record);
  return JSON.stringify(normalized);
};

/**
 * Parses a stored Redis payload into a typed record (or throws a typed error).
 */
const parseRecordOrThrow = <TValue>(raw: string): StoredRecord<TValue> => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && "value" in parsed) {
      return parsed as StoredRecord<TValue>;
    }
    throw new Error("Invalid record shape");
  } catch (err) {
    throw new RecordStoreError("Failed to parse record", { cause: err });
  }
};

class RecordStore {
  /**
   * Stores a record under a namespaced Redis key with TTL.
   */
  static setRecord = async <TValue>(
    input: SetRecordInput<TValue>
  ): Promise<void> => {
    const ttlMs = input.ttlMs;
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new RecordStoreError("setRecord requires a positive `ttlMs`");
    }

    const redis = Redis.getInstance();
    const client = await redis.getClient();
    const redisKey = redis.buildRecordKey(input.key);
    const payload = serializeRecord(input.record);

    await redis.withOperation(async () => {
      // Use PX (ms) so callers can express TTL precisely.
      await client.set(redisKey, payload, { PX: ttlMs });
    });
  };

  /**
   * Fetches a record by namespaced key.
   */
  static getRecord = async <TValue = unknown>(
    key: string
  ): Promise<StoredRecord<TValue> | null> => {
    const redis = Redis.getInstance();
    const client = await redis.getClient();
    const redisKey = redis.buildRecordKey(key);

    const raw = await redis.withOperation(async () => {
      return client.get(redisKey);
    });

    if (raw === null) {
      return null;
    }

    return parseRecordOrThrow<TValue>(raw);
  };

  /**
   * Atomically fetches and revokes a record by namespaced key.
   * Uses Redis GETDEL to prevent races on one-time token consumption flows.
   */
  static consumeRecord = async <TValue = unknown>(
    key: string
  ): Promise<StoredRecord<TValue> | null> => {
    const redis = Redis.getInstance();
    const client = await redis.getClient();
    const redisKey = redis.buildRecordKey(key);

    const raw = await redis.withOperation(async () => {
      return client.getDel(redisKey);
    });

    if (raw === null) {
      return null;
    }

    return parseRecordOrThrow<TValue>(raw);
  };

  /**
   * Revokes a record by deleting its key.
   */
  static revokeRecord = async (key: string): Promise<void> => {
    const redis = Redis.getInstance();
    const client = await redis.getClient();
    const redisKey = redis.buildRecordKey(key);

    await redis.withOperation(async () => {
      await client.del(redisKey);
    });
  };

  /**
   * Bulk revokes records by deleting all keys with a shared keyPrefix.
   * Intended for "family" revocation (e.g. all records for a user).
   */
  static revokeByPrefix = async (
    input: RevokeByPrefixInput
  ): Promise<number> => {
    const redis = Redis.getInstance();
    const client = await redis.getClient();

    const prefix = redis.buildRecordKeyPrefix(input.keyPrefix);
    const match = `${prefix.endsWith(":") ? prefix : prefix + ":"}*`;
    let deletedCount = 0;
    let batch: string[] = [];

    const flush = async (): Promise<void> => {
      if (batch.length === 0) {
        return;
      }
      const count = await client.del(batch);
      deletedCount += count;
      batch = [];
    };

    for await (const keyOrKeys of client.scanIterator({
      MATCH: match,
      COUNT: DEFAULT_SCAN_COUNT,
    })) {
      const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
      for (const k of keys) {
        batch.push(String(k));
      }
      if (batch.length >= DEFAULT_SCAN_COUNT) {
        await flush();
      }
    }

    await flush();
    return deletedCount;
  };
}

const assertImplementsRecordStoreStatic = (
  implementation: IRecordStoreStatic
): void => {
  void implementation;
};
assertImplementsRecordStoreStatic(RecordStore);

export { RecordStore };
