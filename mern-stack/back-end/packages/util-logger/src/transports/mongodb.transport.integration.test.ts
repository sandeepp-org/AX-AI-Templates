import winston from "winston";
import { MongoClient } from "mongodb";
import { createMongodbTransport } from "./mongodb.transport.js";
import { CUSTOM_LEVELS } from "../constants.js";

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DATABASE ?? "aatmix_logger_test";
const COLLECTION = "logger_integration_test";

// How this test is planed
// 1. create a client
// 2. connect to the database
// 3. delete the collection
// 4. create a logger with the transport
// 5. log a message
// 6. wait for the document to be created
// 7. return the document
let client: MongoClient;
let connected = false;

const waitForDoc = async (
  filter: Record<string, unknown>,
  maxMs = 15000
): Promise<Record<string, unknown> | null> => {
  const start = Date.now();
  const col = client.db(dbName).collection(COLLECTION);
  while (Date.now() - start < maxMs) {
    const doc = await col.findOne(filter);
    if (doc) return doc as unknown as Record<string, unknown>;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
};

beforeAll(async () => {
  try {
    client = new MongoClient(uri);
    await client.connect();
    connected = true;
    await client.db(dbName).collection(COLLECTION).deleteMany({});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("Server selection")) {
      connected = false;
      return;
    }
    throw err;
  }
}, 20000);

afterAll(async () => {
  if (connected) {
    await client.db(dbName).collection(COLLECTION).deleteMany({});
    await client.close();
  }
}, 10000);

const skipIfNotConnected = () => !connected;

const createLoggerWithMongoTransport = (): {
  logger: winston.Logger;
  transport: winston.transport;
} => {
  const transport = createMongodbTransport({
    type: "mongodb",
    uri: `${uri}/${dbName}`,
    collection: COLLECTION,
  });

  const logger = winston.createLogger({
    levels: CUSTOM_LEVELS,
    level: "fatal",
    format: winston.format.json(),
    transports: [transport],
  });

  return { logger, transport };
};

describe("mongodb transport — real DB verification", () => {
  it("should write a log entry with message and level to MongoDB", async () => {
    if (skipIfNotConnected()) return;

    const { logger, transport } = createLoggerWithMongoTransport();
    const marker = `test-${Date.now()}`;

    logger.info("integration test log", { marker });

    const doc = await waitForDoc({ "metadata.marker": marker });

    expect(doc).not.toBeNull();
    expect(doc!.message).toBe("integration test log");
    expect(doc!.level).toBe("info");
    expect((doc!.metadata as Record<string, unknown>).marker).toBe(marker);

    transport.close?.();
  }, 25000);

  it("should persist all metadata fields in the document", async () => {
    if (skipIfNotConnected()) return;

    const { logger, transport } = createLoggerWithMongoTransport();
    const marker = `meta-${Date.now()}`;

    logger.info("meta test", { marker, userId: 99, action: "login" });

    const doc = await waitForDoc({ "metadata.marker": marker });

    expect(doc).not.toBeNull();
    expect(doc!.level).toBe("info");
    const metadata = doc!.metadata as Record<string, unknown>;
    expect(metadata.userId).toBe(99);
    expect(metadata.action).toBe("login");

    transport.close?.();
  }, 25000);

  it("should write multiple logs and all should appear in DB", async () => {
    if (skipIfNotConnected()) return;

    const { logger, transport } = createLoggerWithMongoTransport();
    const batch = `batch-${Date.now()}`;

    logger.info("msg-1", { batch, seq: 1 });
    logger.info("msg-2", { batch, seq: 2 });
    logger.info("msg-3", { batch, seq: 3 });

    const start = Date.now();
    let docs: Record<string, unknown>[] = [];
    while (Date.now() - start < 20000) {
      docs = (await client
        .db(dbName)
        .collection(COLLECTION)
        .find({ "metadata.batch": batch })
        .sort({ "metadata.seq": 1 })
        .toArray()) as unknown as Record<string, unknown>[];
      if (docs.length >= 3) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(docs).toHaveLength(3);
    expect(docs[0].message).toBe("msg-1");
    expect(docs[1].message).toBe("msg-2");
    expect(docs[2].message).toBe("msg-3");

    transport.close?.();
  }, 30000);

  it("should include a timestamp field in the persisted document", async () => {
    if (skipIfNotConnected()) return;

    const { logger, transport } = createLoggerWithMongoTransport();
    const marker = `ts-${Date.now()}`;

    logger.info("timestamp check", { marker });

    const doc = await waitForDoc({ "metadata.marker": marker });

    expect(doc).not.toBeNull();
    expect(doc!.timestamp).toBeDefined();

    transport.close?.();
  }, 25000);
});
