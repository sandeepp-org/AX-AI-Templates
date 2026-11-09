import { MongoDb } from "../mongo-db.js";

describe("connect", () => {
  const uri = process.env.MONGODB_URI ?? "";
  const database = process.env.MONGODB_DATABASE ?? "aatmix_mongodb_test";

  afterEach(async () => {
    try {
      await MongoDb.getInstance().close();
    } catch {
      // Singleton already cleared
    }
  });

  it("should connect and close", async () => {
    const db = MongoDb.create({
      uri,
      database,
      connectTimeoutMs: 2000,
    });
    expect(db.isConnected()).toBe(false);
    try {
      await db.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("ECONNREFUSED") ||
        msg.includes("Server selection") ||
        msg.includes("connect ECONNREFUSED") ||
        msg.includes("Invalid scheme") ||
        msg.includes("MongoParseError")
      ) {
        return; // Skip when MongoDB is not running or URI invalid
      }
      throw err;
    }
    expect(db.isConnected()).toBe(true);
    await db.close();
    expect(db.isConnected()).toBe(false);
  }, 20000);

  it("connect() should throw a typed connection error when server is unreachable", async () => {
    const unreachableUri = "mongodb://localhost:27099";
    const db = MongoDb.create({
      uri: unreachableUri,
      database,
      connectTimeoutMs: 500,
    });

    let error: unknown;
    try {
      await db.connect();
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    const typedError = error as Error;
    expect(typeof typedError.name).toBe("string");
    expect(typedError.message.length).toBeGreaterThan(0);
    expect(typedError.message).toMatch(
      /ECONNREFUSED|Server selection|timed out|ECONNRESET|connect ECONNREFUSED/i
    );
  }, 20000);

  it("getInstance should return same instance after create", () => {
    const db = MongoDb.create({ uri, database });
    const same = MongoDb.getInstance();
    expect(same).toBe(db);
  });

  it("getInstance should throw if not initialized", async () => {
    const db = MongoDb.create({ uri, database });
    expect(MongoDb.getInstance()).toBe(db);
    await db.close();
    expect(() => MongoDb.getInstance()).toThrow("not initialized");
  });

  it("collection() should throw when not connected", () => {
    const db = MongoDb.create({ uri, database });

    expect(() => db.collection("users")).toThrow(
      "MongoDb is not connected. Call connect() or perform a CRUD operation first."
    );
  });

  it("should reinitialize cleanly after close and create", async () => {
    const first = MongoDb.create({ uri, database });
    await first.close();

    const second = MongoDb.create({ uri, database });

    expect(second).not.toBe(first);
    expect(MongoDb.getInstance()).toBe(second);
  });

  it("concurrent connect() calls do not open multiple connections", async () => {
    if (
      !uri ||
      (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))
    ) {
      return; // Skip when MongoDB URI is not configured
    }

    const db = MongoDb.create({ uri, database });

    try {
      await Promise.all([db.connect(), db.connect(), db.connect()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("ECONNREFUSED") ||
        msg.includes("Server selection") ||
        msg.includes("connect ECONNREFUSED") ||
        msg.includes("Invalid scheme")
      ) {
        return; // Skip when MongoDB is not running or URI invalid
      }
      throw err;
    }

    expect(db.isConnected()).toBe(true);
    await db.close();
  }, 20000);
});
