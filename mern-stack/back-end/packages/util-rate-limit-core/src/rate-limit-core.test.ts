import { InMemoryRateLimitStore } from "./in-memory-rate-limit-store.js";
import { RateLimitCore } from "./rate-limit-core.js";
import { RATE_LIMIT_SCOPES } from "./types.js";

describe("RateLimitCore", () => {
  it("allows until max and blocks on overflow", async () => {
    const core = new RateLimitCore();
    const policy = { windowMs: 60_000, max: 2 };
    const context = {
      identity: {},
      routeKey: "POST|/v1/ping",
      clientKey: "127.0.0.1",
    };

    const first = await core.consume({
      policy,
      context,
      scope: RATE_LIMIT_SCOPES.GLOBAL,
    });
    const second = await core.consume({
      policy,
      context,
      scope: RATE_LIMIT_SCOPES.GLOBAL,
    });
    const third = await core.consume({
      policy,
      context,
      scope: RATE_LIMIT_SCOPES.GLOBAL,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("uses distinct buckets for distinct users in user scope", async () => {
    const core = new RateLimitCore({
      store: new InMemoryRateLimitStore(),
    });
    const policy = { windowMs: 60_000, max: 1 };
    const base = {
      routeKey: "GET|/v1/users/me",
      clientKey: "127.0.0.1",
    };

    const userAFirst = await core.consume({
      policy,
      context: { ...base, identity: { userId: "user-a" } },
      scope: RATE_LIMIT_SCOPES.USER,
    });
    const userBFirst = await core.consume({
      policy,
      context: { ...base, identity: { userId: "user-b" } },
      scope: RATE_LIMIT_SCOPES.USER,
    });
    const userASecond = await core.consume({
      policy,
      context: { ...base, identity: { userId: "user-a" } },
      scope: RATE_LIMIT_SCOPES.USER,
    });

    expect(userAFirst.allowed).toBe(true);
    expect(userBFirst.allowed).toBe(true);
    expect(userASecond.allowed).toBe(false);
  });

  it("accepts inMemoryStoreOptions via RateLimitCore constructor", async () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);

    const core = new RateLimitCore({
      inMemoryStoreOptions: {
        cleanupIntervalMs: 1_000,
        maxCleanupPerRun: 10,
      },
    });
    const policy = { windowMs: 10, max: 1 };
    const context = {
      identity: {},
      routeKey: "POST|/v1/ping",
      clientKey: "127.0.0.1",
    };

    await core.consume({
      policy,
      context,
      scope: RATE_LIMIT_SCOPES.GLOBAL,
    });

    nowSpy.mockReturnValue(2_100);
    const afterCleanup = await core.consume({
      policy: { windowMs: 10_000, max: 1 },
      context,
      scope: RATE_LIMIT_SCOPES.GLOBAL,
    });

    expect(afterCleanup.allowed).toBe(true);
    expect(afterCleanup.remaining).toBe(0);

    nowSpy.mockRestore();
  });
});
