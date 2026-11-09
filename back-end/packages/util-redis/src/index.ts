import { Redis } from "./redis.js";
import { RecordStore } from "./record-store.js";

export { Redis, RecordStore };

export type {
  RedisConfig,
  StoredRecord,
  SetRecordInput,
  RevokeByPrefixInput,
} from "./types.js";

export type { IRedis, IRedisModule, IRecordStoreStatic } from "./interfaces.js";
