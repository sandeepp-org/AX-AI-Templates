import { MongoDb } from "@util/mongodb";
import { ObjectId } from "mongodb";

import {
  DEFAULT_MEMORY_COLLECTION,
  RETRIEVE_CANDIDATE_LIMIT_BASE,
  RETRIEVE_CANDIDATE_LIMIT_PER_TOPK,
  RETRIEVE_QUERY_MAX_LENGTH,
} from "../constants.js";
import {
  MemoryVersionConflictError,
  MongoMemorySingletonConflictError,
} from "../errors.js";
import { escapeRegexLiteral } from "../helpers/escape-regex-literal.util.js";
import type { MemoryStoreAdapter } from "../interfaces.js";
import type {
  DeleteMemoryInput,
  MemoryEntry,
  MongoAdapterConfig,
  MongoAdapterUriConfig,
  RetrieveMemoryInput,
  UpsertOptions,
} from "../types.js";
import { computeMemoryScore } from "../helpers/compute-memory-score.util.js";

type MongoMemoryDocument = Omit<MemoryEntry, "id"> & {
  _id: ObjectId;
};

/**
 * Converts a MongoDB document into public MemoryEntry shape.
 */
const mapMongoDocumentToMemoryEntry = (
  doc: MongoMemoryDocument
): MemoryEntry => {
  return {
    id: doc._id.toHexString(),
    memoryKey: doc.memoryKey,
    agentId: doc.agentId,
    type: doc.type,
    importance: doc.importance,
    payloadJson: doc.payloadJson,
    searchText: doc.searchText,
    schemaVersion: doc.schemaVersion,
    documentVersion: doc.documentVersion,
    createdAtMs: doc.createdAtMs,
    updatedAtMs: doc.updatedAtMs,
    expiresAtMs: doc.expiresAtMs,
  };
};

/**
 * MongoDB-backed memory store adapter.
 */
class MongoMemoryStoreAdapter implements MemoryStoreAdapter {
  #collectionName: string;

  #mongoDb: MongoDb;

  /** When true, this adapter uses an app-supplied client; `close()` will not disconnect it. */
  #usesInjectedMongo: boolean;

  #closeConnectionOnClose: boolean;

  #indexesInitialized = false;

  #indexInitPromise: Promise<void> | null = null;

  constructor(config: MongoAdapterConfig) {
    this.#collectionName = config.collection ?? DEFAULT_MEMORY_COLLECTION;

    if ("mongoDb" in config) {
      this.#mongoDb = config.mongoDb;
      this.#usesInjectedMongo = true;
      this.#closeConnectionOnClose = false;
      return;
    }

    const uriConfig = config as MongoAdapterUriConfig;
    this.#usesInjectedMongo = false;
    this.#closeConnectionOnClose = uriConfig.closeConnectionOnClose ?? false;
    const existing = MongoDb.tryGetInstance();
    if (existing !== null) {
      const existingConfig = existing.getConfig();
      const hasDifferentConnection =
        existingConfig.uri !== uriConfig.uri ||
        existingConfig.database !== uriConfig.database;

      if (hasDifferentConnection) {
        throw new MongoMemorySingletonConflictError();
      }

      this.#mongoDb = existing;
    } else {
      MongoDb.create({
        uri: uriConfig.uri,
        database: uriConfig.database,
        connectTimeoutMs: uriConfig.connectTimeoutMs,
        maxPoolSize: uriConfig.maxPoolSize,
        minPoolSize: uriConfig.minPoolSize,
      });
      this.#mongoDb = MongoDb.getInstance();
    }
  }

  /**
   * Ensures connection and required indexes are ready.
   */
  #ensureReady = async (): Promise<import("mongodb").Collection> => {
    const db = this.#mongoDb;
    if (!db.isConnected()) {
      await db.connect();
    }
    const collection = db.collection(this.#collectionName);
    if (!this.#indexesInitialized) {
      if (this.#indexInitPromise === null) {
        this.#indexInitPromise = (async (): Promise<void> => {
          try {
            await collection.createIndex({ agentId: 1, type: 1 });
            await collection.createIndex({
              agentId: 1,
              importance: -1,
              updatedAtMs: -1,
            });
            await collection.createIndex(
              { expiresAtMs: 1 },
              { expireAfterSeconds: 0 }
            );
            await collection.createIndex(
              { agentId: 1, memoryKey: 1 },
              {
                unique: true,
                partialFilterExpression: { memoryKey: { $exists: true } },
              }
            );
            this.#indexesInitialized = true;
          } catch (err) {
            this.#indexInitPromise = null;
            throw err;
          }
        })();
      }
      await this.#indexInitPromise;
    }
    return collection;
  };

  /**
   * Upserts a memory document and applies optimistic concurrency when requested.
   */
  upsert = async (
    entry: MemoryEntry,
    options?: UpsertOptions
  ): Promise<MemoryEntry> => {
    const collection = await this.#ensureReady();
    const nowMs = Date.now();
    const filter: Record<string, unknown> = { agentId: entry.agentId };
    if (entry.memoryKey !== undefined) {
      filter.memoryKey = entry.memoryKey;
    } else if (entry.id !== undefined) {
      filter._id = new ObjectId(entry.id);
    } else {
      filter._id = new ObjectId();
    }
    if (options?.expectedDocumentVersion !== undefined) {
      filter.documentVersion = options.expectedDocumentVersion;
    }

    const setOnInsert = {
      createdAtMs: entry.createdAtMs,
    };
    const set = {
      memoryKey: entry.memoryKey,
      agentId: entry.agentId,
      type: entry.type,
      importance: entry.importance,
      payloadJson: entry.payloadJson,
      searchText: entry.searchText,
      schemaVersion: entry.schemaVersion,
      updatedAtMs: nowMs,
      expiresAtMs: entry.expiresAtMs,
    };

    const updated = await collection.findOneAndUpdate(
      filter,
      {
        $setOnInsert: setOnInsert,
        $set: set,
        $inc: { documentVersion: 1 },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (updated === null) {
      throw new MemoryVersionConflictError();
    }
    return mapMongoDocumentToMemoryEntry(updated as MongoMemoryDocument);
  };

  /**
   * Deletes a memory entry by agent partition and id.
   */
  delete = async (input: DeleteMemoryInput): Promise<void> => {
    const collection = await this.#ensureReady();
    await collection.deleteOne({
      _id: new ObjectId(input.id),
      agentId: input.agentId,
    });
  };

  /**
   * Retrieves relevant memories for an agent partition.
   */
  retrieve = async (input: RetrieveMemoryInput): Promise<MemoryEntry[]> => {
    const collection = await this.#ensureReady();
    const nowMs = Date.now();
    const filter: Record<string, unknown> = {
      agentId: input.agentId,
      $or: [
        { expiresAtMs: { $exists: false } },
        { expiresAtMs: null },
        { expiresAtMs: { $gt: nowMs } },
      ],
    };
    if (input.types !== undefined && input.types.length > 0) {
      filter.type = { $in: input.types };
    }
    if (input.query !== undefined && input.query.trim().length > 0) {
      const rawQuery = input.query.trim().slice(0, RETRIEVE_QUERY_MAX_LENGTH);
      const literal = escapeRegexLiteral(rawQuery.toLowerCase());
      filter.searchText = {
        $regex: literal,
        $options: "i",
      };
    }

    const topK = input.topK ?? 5;
    const candidateLimit = Math.max(
      RETRIEVE_CANDIDATE_LIMIT_BASE,
      topK * RETRIEVE_CANDIDATE_LIMIT_PER_TOPK
    );
    const rawDocs = (await collection
      .find(filter)
      .limit(candidateLimit)
      .toArray()) as MongoMemoryDocument[];
    const entries = rawDocs.map(mapMongoDocumentToMemoryEntry);
    const ranked = entries.sort((a, b) => {
      return computeMemoryScore(b, nowMs) - computeMemoryScore(a, nowMs);
    });
    return ranked.slice(0, topK);
  };

  /**
   * Optionally closes the MongoDB client when configured via URI and `closeConnectionOnClose`.
   * Never disconnects an injected `mongoDb` instance.
   */
  close = async (): Promise<void> => {
    if (this.#usesInjectedMongo || !this.#closeConnectionOnClose) {
      return;
    }
    if (this.#mongoDb.isConnected()) {
      await this.#mongoDb.close();
    }
  };
}

export { MongoMemoryStoreAdapter };
