import type { Collection, ClientSession } from "mongodb";

import type {
  MongoDbConfig,
  MongoDbState,
  CreateOneParams,
  CreateManyParams,
  FindOneParams,
  FindManyParams,
  CountDocumentsParams,
  DistinctParams,
  UpdateOneParams,
  UpdateManyParams,
  FindOneAndUpdateParams,
  DeleteOneParams,
  DeleteManyParams,
  FindOneAndDeleteParams,
  AggregateParams,
  CreateOneResult,
  CreateManyResult,
  UpdateOneResult,
  UpdateManyResult,
  DeleteOneResult,
  DeleteManyResult,
  WithTransactionOptions,
} from "./types.js";
import type { MongoDbContract } from "./interfaces.js";
import type { Logger } from "@util/logger";

import {
  connect,
  close,
  isConnected,
  ensureConnected,
} from "./operations/connect.js";
import {
  createOne as opCreateOne,
  createMany as opCreateMany,
} from "./operations/create.js";
import {
  findOne as opFindOne,
  findMany as opFindMany,
  countDocuments as opCountDocuments,
  distinct as opDistinct,
} from "./operations/read.js";
import {
  updateOne as opUpdateOne,
  updateMany as opUpdateMany,
  findOneAndUpdate as opFindOneAndUpdate,
} from "./operations/update.js";
import {
  deleteOne as opDeleteOne,
  deleteMany as opDeleteMany,
  findOneAndDelete as opFindOneAndDelete,
} from "./operations/delete.js";
import { aggregate as opAggregate } from "./operations/aggregate.js";

/**
 * Creates a no-op logger used when the caller does not supply a Logger instance.
 */
const buildDefaultLogger = (): Logger => {
  const noop = (): void => {};
  return {
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child: () => buildDefaultLogger(),
    close: () => Promise.resolve(),
  } as unknown as Logger;
};

class MongoDb implements MongoDbContract {
  static #instance: MongoDb | null = null;

  #state: MongoDbState;

  private constructor(state: MongoDbState) {
    this.#state = state;
  }

  /**
   * Creates and stores the singleton MongoDb instance with the given configuration.
   */
  static create = (config: MongoDbConfig): MongoDb => {
    const logger = config.logger ?? buildDefaultLogger();
    const state: MongoDbState = {
      client: null,
      db: null,
      connectPromise: null,
      logger,
      config,
    };
    const instance = new MongoDb(state);
    MongoDb.#instance = instance;
    return instance;
  };

  /**
   * Returns the previously created MongoDb singleton or throws if not initialized.
   */
  static getInstance = (): MongoDb => {
    if (MongoDb.#instance === null) {
      throw new Error("MongoDb not initialized. Call MongoDb.create() first.");
    }
    return MongoDb.#instance;
  };

  /**
   * Returns the current MongoDb singleton when initialized, otherwise null.
   */
  static tryGetInstance = (): MongoDb | null => {
    return MongoDb.#instance;
  };

  /**
   * Returns the immutable configuration used to initialize this MongoDb instance.
   */
  getConfig = (): MongoDbConfig => {
    return this.#state.config;
  };

  /**
   * Opens the underlying MongoDB connection if it is not already connected.
   */
  connect = async (): Promise<void> => {
    await connect(this.#state);
  };

  /**
   * Closes the MongoDB connection and clears the singleton reference when appropriate.
   */
  close = async (): Promise<void> => {
    if (MongoDb.#instance === this) {
      MongoDb.#instance = null;
    }
    await close(this.#state);
  };

  /**
   * Returns true when the underlying MongoDB client is connected.
   */
  isConnected = (): boolean => {
    return isConnected(this.#state);
  };

  /**
   * Exposes the native MongoDB collection for advanced or escape-hatch operations.
   */
  collection = (name: string): Collection => {
    const db = this.#state.db;
    if (db === null) {
      throw new Error(
        "MongoDb is not connected. Call connect() or perform a CRUD operation first."
      );
    }
    return db.collection(name);
  };

  /**
   * Starts a new client session after ensuring there is an active connection.
   */
  startSession = async (): Promise<ClientSession> => {
    await ensureConnected(this.#state);
    if (this.#state.client === null) {
      throw new Error(
        "MongoDb client is not available. Call connect() before starting a session."
      );
    }
    return this.#state.client.startSession();
  };

  /**
   * Runs the provided operation inside a MongoDB transaction.
   * Commits on success and aborts on error; always ends the session.
   */
  withTransaction = async <T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: WithTransactionOptions
  ): Promise<T> => {
    const session = await this.startSession();
    const transactionOptions = options?.transactionOptions;
    const maxCommitTimeMs = options?.maxCommitTimeMs;

    try {
      await session.startTransaction(transactionOptions);
      const result = await operation(session);

      if (typeof maxCommitTimeMs === "number") {
        await session.commitTransaction({
          maxTimeMS: maxCommitTimeMs,
        } as never);
      } else {
        await session.commitTransaction();
      }

      return result;
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch {
        // Swallow abort errors; original error is more important for callers.
      }
      throw error;
    } finally {
      await session.endSession();
    }
  };

  /**
   * Ensures there is an active connection and returns the Db handle.
   */
  #ensureDb = async (): Promise<import("mongodb").Db> => {
    await ensureConnected(this.#state);
    return this.#state.db!;
  };

  /**
   * Inserts a single document into the target collection after validation and auto-field enrichment.
   */
  createOne = async <T extends Record<string, unknown>>(
    params: CreateOneParams<T>
  ): Promise<CreateOneResult> => {
    const db = await this.#ensureDb();
    return opCreateOne(db, this.#state.logger, params);
  };

  /**
   * Inserts multiple documents into the target collection in a single bulk operation.
   */
  createMany = async <T extends Record<string, unknown>>(
    params: CreateManyParams<T>
  ): Promise<CreateManyResult> => {
    const db = await this.#ensureDb();
    return opCreateMany(db, this.#state.logger, params);
  };

  /**
   * Finds a single active document matching the filter and optionally parses it with a Zod schema.
   */
  findOne = async <T>(params: FindOneParams<T>): Promise<T | null> => {
    const db = await this.#ensureDb();
    return opFindOne(db, this.#state.logger, params);
  };

  /**
   * Finds multiple active documents matching the filter with optional sorting and paging.
   */
  findMany = async <T>(params: FindManyParams<T>): Promise<T[]> => {
    const db = await this.#ensureDb();
    return opFindMany(db, this.#state.logger, params);
  };

  /**
   * Counts active documents in the collection that match the provided filter.
   */
  countDocuments = async (params: CountDocumentsParams): Promise<number> => {
    const db = await this.#ensureDb();
    return opCountDocuments(db, this.#state.logger, params);
  };

  /**
   * Returns distinct values for a field across all active documents that match the filter.
   */
  distinct = async <T>(params: DistinctParams<T>): Promise<T[]> => {
    const db = await this.#ensureDb();
    return opDistinct(db, this.#state.logger, params);
  };

  /**
   * Updates a single active document and optionally enforces optimistic concurrency via updatedAt.
   */
  updateOne = async <T>(
    params: UpdateOneParams<T>
  ): Promise<UpdateOneResult> => {
    const db = await this.#ensureDb();
    return opUpdateOne(db, this.#state.logger, params);
  };

  /**
   * Updates all active documents that match the filter in a single bulk operation.
   */
  updateMany = async <T>(
    params: UpdateManyParams<T>
  ): Promise<UpdateManyResult> => {
    const db = await this.#ensureDb();
    return opUpdateMany(db, this.#state.logger, params);
  };

  /**
   * Updates a single active document and returns the updated version, with optional concurrency checks.
   */
  findOneAndUpdate = async <T>(
    params: FindOneAndUpdateParams<T>
  ): Promise<T | null> => {
    const db = await this.#ensureDb();
    return opFindOneAndUpdate(db, this.#state.logger, params);
  };

  /**
   * Soft-deletes a single active document by marking its status as inactive.
   */
  deleteOne = async (params: DeleteOneParams): Promise<DeleteOneResult> => {
    const db = await this.#ensureDb();
    return opDeleteOne(db, this.#state.logger, params);
  };

  /**
   * Soft-deletes all active documents that match the filter by marking their status as inactive.
   */
  deleteMany = async (params: DeleteManyParams): Promise<DeleteManyResult> => {
    const db = await this.#ensureDb();
    return opDeleteMany(db, this.#state.logger, params);
  };

  /**
   * Soft-deletes a single active document and returns the updated (inactive) document.
   */
  findOneAndDelete = async <T>(
    params: FindOneAndDeleteParams<T>
  ): Promise<T | null> => {
    const db = await this.#ensureDb();
    return opFindOneAndDelete(db, this.#state.logger, params);
  };

  /**
   * Runs an aggregation pipeline on the collection while automatically filtering for active documents.
   */
  aggregate = async <T = unknown>(params: AggregateParams<T>): Promise<T[]> => {
    const db = await this.#ensureDb();
    return opAggregate(db, this.#state.logger, params);
  };
}

export { MongoDb };
