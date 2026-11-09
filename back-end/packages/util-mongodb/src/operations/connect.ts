import type { MongoDbState } from "../types.js";
import { MongoClient } from "mongodb";

import {
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_MAX_POOL_SIZE,
  DEFAULT_MIN_POOL_SIZE,
} from "../constants.js";

/**
 * Opens a MongoDB client and database connection if one is not already established.
 * Concurrent calls share the same connection attempt; only one physical connection is opened.
 */
const connect = async (state: MongoDbState): Promise<void> => {
  const isAlreadyConnected = state.client !== null && state.db !== null;

  if (isAlreadyConnected) {
    return;
  }

  if (state.connectPromise !== null) {
    await state.connectPromise;
    return;
  }

  const doConnect = async (): Promise<void> => {
    try {
      const config = state.config;

      const timeoutMs = config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
      const client = new MongoClient(config.uri, {
        connectTimeoutMS: timeoutMs,
        serverSelectionTimeoutMS: timeoutMs,
        maxPoolSize: config.maxPoolSize ?? DEFAULT_MAX_POOL_SIZE,
        minPoolSize: config.minPoolSize ?? DEFAULT_MIN_POOL_SIZE,
      });

      await client.connect();

      state.client = client;
      state.db = client.db(config.database);

      const redactedUri = config.uri.replace(/:\/\/[^@]+@/, "://<redacted>@");
      state.logger.info("MongoDB connection opened", {
        uri: redactedUri,
        database: config.database,
      });
    } finally {
      state.connectPromise = null;
    }
  };

  state.connectPromise = doConnect();
  await state.connectPromise;
};

/**
 * Closes the active MongoDB client connection if it exists.
 */
const close = async (state: MongoDbState): Promise<void> => {
  if (state.client === null) {
    return;
  }

  await state.client.close();

  state.logger.info("MongoDB connection closed", {
    database: state.config.database,
  });

  state.client = null;
  state.db = null;
  state.connectPromise = null;
};

/**
 * Returns true if both client and db handles are currently set.
 */
const isConnected = (state: MongoDbState): boolean => {
  return state.client !== null && state.db !== null;
};

/**
 * Ensures there is an active connection by calling connect when needed.
 */
const ensureConnected = async (state: MongoDbState): Promise<void> => {
  if (!isConnected(state)) {
    await connect(state);
  }
};

export { connect, close, isConnected, ensureConnected };
