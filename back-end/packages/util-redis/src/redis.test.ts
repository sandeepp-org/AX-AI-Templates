import { Redis } from "./redis.js";

describe("Redis — singleton lifecycle", () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const keyPrefix = "util-redis:test";

  afterEach(async () => {
    try {
      const instance = Redis.getInstance();
      await instance.close();
    } catch {
      // Singleton not initialized or already cleared.
    }
  });

  it("getInstance should throw if create has not been called", () => {
    expect(() => Redis.getInstance()).toThrow("Redis not initialized");
  });

  it("create should store singleton and getInstance should return same reference", async () => {
    const instance = Redis.create({ url, keyPrefix });
    const same = Redis.getInstance();
    expect(same).toBe(instance);
  });

  it("connect + close should work", async () => {
    const instance = Redis.create({ url, keyPrefix });
    expect(instance.isConnected()).toBe(false);

    try {
      await instance.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        err instanceof AggregateError ||
        msg.includes("AggregateError") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("connect ECONNREFUSED") ||
        msg.includes("Socket closed") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("ECONNREFUSED")
      ) {
        return; // Skip when Redis is not running.
      }
      throw err;
    }

    expect(instance.isConnected()).toBe(true);
    await instance.close();
    expect(instance.isConnected()).toBe(false);
  }, 20000);

  it("close should clear singleton so getInstance throws", async () => {
    const instance = Redis.create({ url, keyPrefix });
    await instance.close();
    expect(() => Redis.getInstance()).toThrow("Redis not initialized");
  });
});
