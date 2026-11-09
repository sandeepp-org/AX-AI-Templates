import { z } from "zod";
import { MongoDb } from "../mongo-db.js";
import { DocumentStatus } from "../constants.js";
import { MongoDbValidationError, MongoDbConflictError } from "../errors.js";

const uri = process.env.MONGODB_URI ?? "";
const database = process.env.MONGODB_DATABASE ?? "aatmix_mongodb_test";
const TEST_COLLECTION = "crud_test";

let db: MongoDb | null = null;
let connected = false;

beforeAll(async () => {
  if (!uri || !uri.startsWith("mongodb")) {
    connected = false;
    return;
  }
  db = MongoDb.create({ uri, database });
  try {
    await db.connect();
    connected = true;
    const col = db.collection(TEST_COLLECTION);
    await col.deleteMany({});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("Server selection") ||
      msg.includes("Invalid scheme") ||
      msg.includes("MongoParseError")
    ) {
      connected = false;
      return;
    }
    throw err;
  }
}, 20000);

afterAll(async () => {
  if (connected && db) {
    const col = db.collection(TEST_COLLECTION);
    await col.deleteMany({});
  }
  if (db) {
    await db.close();
  }
}, 10000);

const skipIfNotConnected = (): boolean => !connected;

describe("createOne", () => {
  it("should insert a document with auto-fields", async () => {
    if (skipIfNotConnected() || !db) return;

    const result = await db.createOne({
      collection: TEST_COLLECTION,
      doc: { name: "Alice", email: "alice@test.com" },
    });

    expect(result.acknowledged).toBe(true);
    expect(result.insertedId).toBeDefined();
  });

  it("should validate with Zod schema on create", async () => {
    if (skipIfNotConnected() || !db) return;

    const schema = z.object({ name: z.string().min(1), age: z.number() });

    const result = await db.createOne({
      collection: TEST_COLLECTION,
      doc: { name: "Bob", age: 25 },
      schema,
    });

    expect(result.acknowledged).toBe(true);
  });

  it("should throw MongoDbValidationError when schema fails", async () => {
    if (skipIfNotConnected() || !db) return;

    const schema = z.object({ name: z.string().min(1), age: z.number() });
    let error: MongoDbValidationError | null = null;

    try {
      await db.createOne({
        collection: TEST_COLLECTION,
        doc: { name: "", age: "not-a-number" } as unknown as {
          name: string;
          age: number;
        },
        schema,
      });
    } catch (err) {
      error = err as MongoDbValidationError;
    }

    expect(error).toBeInstanceOf(MongoDbValidationError);
    expect(error!.collection).toBe(TEST_COLLECTION);
    expect(error!.operation).toBe("createOne");
  });
});

describe("createMany", () => {
  it("should insert multiple documents", async () => {
    if (skipIfNotConnected() || !db) return;

    const result = await db.createMany({
      collection: TEST_COLLECTION,
      docs: [
        { name: "Carol", role: "admin" },
        { name: "Dave", role: "user" },
      ],
    });

    expect(result.acknowledged).toBe(true);
    expect(result.insertedCount).toBe(2);
    expect(result.insertedIds).toHaveLength(2);
  });
});

describe("findOne", () => {
  it("should find an active document by filter", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "Alice" },
    });

    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>).name).toBe("Alice");
    expect((doc as Record<string, unknown>).status).toBe(DocumentStatus.ACTIVE);
  });

  it("should return null when document does not exist", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "NonExistent" },
    });

    expect(doc).toBeNull();
  });
});

describe("findMany", () => {
  it("should find multiple active documents", async () => {
    if (skipIfNotConnected() || !db) return;

    const docs = await db.findMany({
      collection: TEST_COLLECTION,
      filter: {},
    });

    expect(docs.length).toBeGreaterThanOrEqual(3);
  });

  it("should respect limit and sort", async () => {
    if (skipIfNotConnected() || !db) return;

    const docs = await db.findMany({
      collection: TEST_COLLECTION,
      filter: {},
      sort: { name: 1 },
      limit: 2,
    });

    expect(docs).toHaveLength(2);
    const names = docs.map((d) => (d as Record<string, unknown>).name);
    expect(names[0]! <= names[1]!).toBe(true);
  });
});

describe("countDocuments", () => {
  it("should count active documents", async () => {
    if (skipIfNotConnected() || !db) return;

    const count = await db.countDocuments({
      collection: TEST_COLLECTION,
    });

    expect(count).toBeGreaterThanOrEqual(3);
  });
});

describe("updateOne", () => {
  it("should update a single document", async () => {
    if (skipIfNotConnected() || !db) return;

    const result = await db.updateOne({
      collection: TEST_COLLECTION,
      filter: { name: "Alice" },
      update: { $set: { email: "alice-updated@test.com" } },
    });

    expect(result.acknowledged).toBe(true);
    expect(result.matchedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);
  });

  it("should verify update persisted", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "Alice" },
    });

    expect((doc as Record<string, unknown>).email).toBe(
      "alice-updated@test.com"
    );
  });
});

describe("findOneAndUpdate", () => {
  it("should update and return the updated document", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOneAndUpdate({
      collection: TEST_COLLECTION,
      filter: { name: "Bob" },
      update: { $set: { age: 26 } },
    });

    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>).age).toBe(26);
  });
});

describe("deleteOne (soft)", () => {
  it("should soft-delete a document by setting status to inactive", async () => {
    if (skipIfNotConnected() || !db) return;

    const result = await db.deleteOne({
      collection: TEST_COLLECTION,
      filter: { name: "Carol" },
    });

    expect(result.acknowledged).toBe(true);
    expect(result.deletedCount).toBe(1);
  });

  it("should not find soft-deleted document in active queries", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "Carol" },
    });

    expect(doc).toBeNull();
  });
});

describe("findOneAndDelete", () => {
  it("should soft-delete and return the document", async () => {
    if (skipIfNotConnected() || !db) return;

    const doc = await db.findOneAndDelete({
      collection: TEST_COLLECTION,
      filter: { name: "Dave" },
    });

    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>).status).toBe(
      DocumentStatus.INACTIVE
    );
  });
});

describe("aggregate", () => {
  it("should run pipeline and auto-filter by active status", async () => {
    if (skipIfNotConnected() || !db) return;

    const results = await db.aggregate({
      collection: TEST_COLLECTION,
      pipeline: [{ $match: {} }, { $project: { name: 1, _id: 0 } }],
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const names = results.map((r) => (r as Record<string, unknown>).name);
    expect(names).not.toContain("Carol");
    expect(names).not.toContain("Dave");
  });

  it("should support aggregation with empty pipeline", async () => {
    if (skipIfNotConnected() || !db) return;

    const results = await db.aggregate({
      collection: TEST_COLLECTION,
      pipeline: [],
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

describe("distinct", () => {
  it("should return distinct values for a field across active docs", async () => {
    if (skipIfNotConnected() || !db) return;

    const values = await db.distinct<string>({
      collection: TEST_COLLECTION,
      field: "name",
    });

    expect(values).toContain("Alice");
    expect(values).toContain("Bob");
    expect(values).not.toContain("Carol");
    expect(values).not.toContain("Dave");
  });
});

describe("updateMany", () => {
  it("should update multiple documents matching the filter", async () => {
    if (skipIfNotConnected() || !db) return;

    const result = await db.updateMany({
      collection: TEST_COLLECTION,
      filter: {},
      update: { $set: { bulkTag: "batch-1" } },
    });

    expect(result.acknowledged).toBe(true);
    expect(result.matchedCount).toBeGreaterThanOrEqual(2);
    expect(result.modifiedCount).toBeGreaterThanOrEqual(2);
  });

  it("should verify bulkTag persisted on all active docs", async () => {
    if (skipIfNotConnected() || !db) return;

    const docs = await db.findMany({
      collection: TEST_COLLECTION,
      filter: {},
    });

    const allTagged = docs.every(
      (d) => (d as Record<string, unknown>).bulkTag === "batch-1"
    );
    expect(allTagged).toBe(true);
  });
});

describe("deleteMany", () => {
  it("should soft-delete multiple documents", async () => {
    if (skipIfNotConnected() || !db) return;

    await db.createMany({
      collection: TEST_COLLECTION,
      docs: [
        { name: "TempA", disposable: true },
        { name: "TempB", disposable: true },
      ],
    });

    const result = await db.deleteMany({
      collection: TEST_COLLECTION,
      filter: { disposable: true },
    });

    expect(result.acknowledged).toBe(true);
    expect(result.deletedCount).toBe(2);

    const remaining = await db.findMany({
      collection: TEST_COLLECTION,
      filter: { disposable: true },
    });
    expect(remaining).toHaveLength(0);
  });
});

describe("optimistic concurrency", () => {
  it("should throw MongoDbConflictError when updatedAt filter mismatches", async () => {
    if (skipIfNotConnected() || !db) return;

    const staleTimestamp = new Date("2000-01-01T00:00:00Z");
    let error: MongoDbConflictError | null = null;

    try {
      await db.updateOne({
        collection: TEST_COLLECTION,
        filter: { name: "Alice", updatedAt: staleTimestamp },
        update: { $set: { email: "conflict@test.com" } },
      });
    } catch (err) {
      error = err as MongoDbConflictError;
    }

    expect(error).toBeInstanceOf(MongoDbConflictError);
    expect(error!.collection).toBe(TEST_COLLECTION);
    expect(error!.operation).toBe("updateOne");
  });

  it("should throw MongoDbConflictError on findOneAndUpdate with stale updatedAt", async () => {
    if (skipIfNotConnected() || !db) return;

    const staleTimestamp = new Date("2000-01-01T00:00:00Z");
    let error: MongoDbConflictError | null = null;

    try {
      await db.findOneAndUpdate({
        collection: TEST_COLLECTION,
        filter: { name: "Alice", updatedAt: staleTimestamp },
        update: { $set: { email: "conflict2@test.com" } },
      });
    } catch (err) {
      error = err as MongoDbConflictError;
    }

    expect(error).toBeInstanceOf(MongoDbConflictError);
    expect(error!.operation).toBe("findOneAndUpdate");
  });
});

describe("transactions", () => {
  const transactionsUnsupported = (error: unknown): boolean => {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message;
    return (
      message.includes("Transaction numbers") ||
      message.includes("ReplicaSetNoPrimary") ||
      message.includes("replica set") ||
      message.includes("not supported")
    );
  };

  it("should commit multiple operations in a single transaction", async () => {
    if (skipIfNotConnected() || !db) return;

    try {
      await db.withTransaction(async (session) => {
        await db!.createOne({
          collection: TEST_COLLECTION,
          doc: { name: "TxnUser", email: "txn-user@test.com" },
          session,
        });

        await db!.updateOne({
          collection: TEST_COLLECTION,
          filter: { name: "TxnUser" },
          update: { $set: { email: "txn-user-updated@test.com" } },
          session,
        });
      });
    } catch (err) {
      if (transactionsUnsupported(err)) {
        return;
      }
      throw err;
    }

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "TxnUser" },
    });

    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>).email).toBe(
      "txn-user-updated@test.com"
    );
  });

  it("should rollback all operations when transaction function throws", async () => {
    if (skipIfNotConnected() || !db) return;

    let error: unknown;

    try {
      await db.withTransaction(async (session) => {
        await db!.createOne({
          collection: TEST_COLLECTION,
          doc: { name: "TxnRollbackUser", email: "rollback@test.com" },
          session,
        });

        await db!.updateOne({
          collection: TEST_COLLECTION,
          filter: { name: "TxnRollbackUser" },
          update: { $set: { email: "rollback-updated@test.com" } },
          session,
        });

        throw new Error("force rollback");
      });
    } catch (err) {
      if (transactionsUnsupported(err)) {
        return;
      }
      error = err;
    }

    expect(error).toBeInstanceOf(Error);

    const doc = await db.findOne({
      collection: TEST_COLLECTION,
      filter: { name: "TxnRollbackUser" },
    });

    expect(doc).toBeNull();
  });
});
