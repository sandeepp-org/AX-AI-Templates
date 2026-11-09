import { InMemoryRateLimitStore } from "./in-memory-rate-limit-store.js";

describe("InMemoryRateLimitStore", () => {
  it("cleans up expired buckets after cleanup interval", async () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);

    const store = new InMemoryRateLimitStore({
      cleanupIntervalMs: 1_000,
      maxCleanupPerRun: 100,
    });

    await store.increment({
      bucketKey: "expired",
      windowMs: 10,
      limit: 1,
    });

    nowSpy.mockReturnValue(2_100);
    await store.increment({
      bucketKey: "fresh",
      windowMs: 10_000,
      limit: 1,
    });

    const reusedExpired = await store.increment({
      bucketKey: "expired",
      windowMs: 10_000,
      limit: 1,
    });

    expect(reusedExpired.allowed).toBe(true);
    expect(reusedExpired.remaining).toBe(0);

    nowSpy.mockRestore();
  });

  it("preserves active buckets while cleanup runs", async () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);

    const store = new InMemoryRateLimitStore({
      cleanupIntervalMs: 1_000,
      maxCleanupPerRun: 1,
    });

    await store.increment({
      bucketKey: "active",
      windowMs: 10_000,
      limit: 2,
    });
    await store.increment({
      bucketKey: "expired",
      windowMs: 10,
      limit: 1,
    });

    nowSpy.mockReturnValue(2_100);
    await store.increment({
      bucketKey: "trigger",
      windowMs: 10_000,
      limit: 1,
    });

    const activeSecond = await store.increment({
      bucketKey: "active",
      windowMs: 10_000,
      limit: 2,
    });

    expect(activeSecond.allowed).toBe(true);
    expect(activeSecond.remaining).toBe(0);

    nowSpy.mockRestore();
  });
});
