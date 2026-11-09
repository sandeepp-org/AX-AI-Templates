import { Redis } from "./redis.js";
import { RecordStore } from "./record-store.js";
import type { StoredRecord } from "./types.js";

describe("RecordStore — record lifecycle", () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const suiteKeyPrefix = "util-redis-suite";

  afterEach(async () => {
    try {
      await RecordStore.revokeByPrefix({ keyPrefix: suiteKeyPrefix });
    } catch {
      // Ignore cleanup failures.
    }

    try {
      const instance = Redis.getInstance();
      await instance.close();
    } catch {
      // Ignore if not initialized.
    }
  });

  it("setRecord() then getRecord() should round-trip", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const record: StoredRecord<{ sessionId: string }> = {
      value: { sessionId: "s1" },
    };

    const key = `${suiteKeyPrefix}:user-1:refresh-abc`;
    await RecordStore.setRecord({ key, record, ttlMs: 10_000 });

    const loaded = await RecordStore.getRecord<{ sessionId: string }>(key);
    expect(loaded).not.toBeNull();
    expect(loaded!.value.sessionId).toBe("s1");
  }, 20000);

  it("setRecord() should throw when Redis.create() has not been called", async () => {
    await expect(
      RecordStore.setRecord({
        key: "util-redis:uninitialized",
        record: { value: { sessionId: "s1" } },
        ttlMs: 10_000,
      })
    ).rejects.toThrow("Redis not initialized");
  });

  it("setRecord() should validate ttlMs", async () => {
    await expect(
      RecordStore.setRecord({
        key: "util-redis:bad-ttl",
        record: { value: { sessionId: "s1" } },
        ttlMs: 0,
      })
    ).rejects.toThrow("setRecord requires a positive `ttlMs`");
  });

  it("getRecord() should throw when Redis.create() has not been called", async () => {
    await expect(
      RecordStore.getRecord("util-redis:uninitialized")
    ).rejects.toThrow("Redis not initialized");
  });

  it("consumeRecord() should throw when Redis.create() has not been called", async () => {
    await expect(
      RecordStore.consumeRecord("util-redis:uninitialized")
    ).rejects.toThrow("Redis not initialized");
  });

  it("getRecord() should throw when stored payload is invalid JSON", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const rawKey = `${suiteKeyPrefix}:user-1:refresh-invalid-json`;
    const redisKey = instance.buildRecordKey(rawKey);
    const client = await instance.getClient();

    await client.set(redisKey, "not-json", { PX: 10_000 });

    await expect(
      RecordStore.getRecord<{ sessionId: string }>(rawKey)
    ).rejects.toThrow("Failed to parse record");
  }, 20000);

  it("getRecord() should throw when stored payload has an invalid shape", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const rawKey = `${suiteKeyPrefix}:user-1:refresh-invalid-shape`;
    const redisKey = instance.buildRecordKey(rawKey);
    const client = await instance.getClient();

    await client.set(redisKey, JSON.stringify({ notValue: true }), {
      PX: 10_000,
    });

    await expect(
      RecordStore.getRecord<{ sessionId: string }>(rawKey)
    ).rejects.toThrow("Failed to parse record");
  }, 20000);

  it("revokeRecord() should throw when Redis.create() has not been called", async () => {
    await expect(
      RecordStore.revokeRecord("util-redis:uninitialized")
    ).rejects.toThrow("Redis not initialized");
  });

  it("revokeByPrefix() should throw when Redis.create() has not been called", async () => {
    await expect(
      RecordStore.revokeByPrefix({ keyPrefix: "util-redis:uninitialized" })
    ).rejects.toThrow("Redis not initialized");
  });

  it("setRecord() should expire based on ttlMs", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const ttlMs = 50;
    const key = `${suiteKeyPrefix}:user-1:refresh-expiring`;

    await RecordStore.setRecord({
      key,
      record: { value: { sessionId: "s-exp" } },
      ttlMs,
    });

    await new Promise((resolve) => setTimeout(resolve, ttlMs + 60));
    const loaded = await RecordStore.getRecord<{ sessionId: string }>(key);
    expect(loaded).toBeNull();
  }, 20000);

  it("revokeRecord() should delete a stored record", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const key = `${suiteKeyPrefix}:user-1:refresh-revoked`;

    await RecordStore.setRecord({
      key,
      record: { value: { sessionId: "s-rev" } },
      ttlMs: 10_000,
    });

    await RecordStore.revokeRecord(key);
    const loaded = await RecordStore.getRecord<{ sessionId: string }>(key);
    expect(loaded).toBeNull();
  }, 20000);

  it("consumeRecord() should atomically fetch and delete a stored record", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const key = `${suiteKeyPrefix}:user-1:refresh-consume`;
    await RecordStore.setRecord({
      key,
      record: { value: { sessionId: "s-consume" } },
      ttlMs: 10_000,
    });

    const consumed = await RecordStore.consumeRecord<{ sessionId: string }>(
      key
    );
    expect(consumed).not.toBeNull();
    expect(consumed!.value.sessionId).toBe("s-consume");

    const secondConsume = await RecordStore.consumeRecord(key);
    expect(secondConsume).toBeNull();
  }, 20000);

  it("revokeByPrefix() should bulk-delete matching keys", async () => {
    const instance = Redis.create({
      url,
      keyPrefix: "util-redis:test",
      recordNamespace: "records",
    });

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    const key1 = `${suiteKeyPrefix}:user-1:refresh-1`;
    const key2 = `${suiteKeyPrefix}:user-1:refresh-2`;
    const key3 = `${suiteKeyPrefix}-other:user-1:refresh-3`;

    await RecordStore.setRecord({
      key: key1,
      record: { value: { sessionId: "s1" } },
      ttlMs: 10_000,
    });
    await RecordStore.setRecord({
      key: key2,
      record: { value: { sessionId: "s2" } },
      ttlMs: 10_000,
    });
    await RecordStore.setRecord({
      key: key3,
      record: { value: { sessionId: "s3" } },
      ttlMs: 10_000,
    });

    const deleted = await RecordStore.revokeByPrefix({
      keyPrefix: suiteKeyPrefix,
    });
    expect(deleted).toBeGreaterThanOrEqual(2);

    expect(await RecordStore.getRecord<{ sessionId: string }>(key1)).toBeNull();
    expect(await RecordStore.getRecord<{ sessionId: string }>(key2)).toBeNull();
    // key3 should remain because it has a different prefix after the package namespace.
    expect(
      await RecordStore.getRecord<{ sessionId: string }>(key3)
    ).not.toBeNull();
  }, 20000);
});
