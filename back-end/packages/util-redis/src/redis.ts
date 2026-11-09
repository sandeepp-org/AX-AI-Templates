import { createClient } from "redis";

import {
  DEFAULT_BASE_RETRY_DELAY_MS,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_KEY_PREFIX,
  DEFAULT_MAX_RETRY_ATTEMPTS,
  DEFAULT_RECORD_NAMESPACE,
  DEFAULT_RECORD_TTL_SECONDS,
} from "./constants.js";
import { withRetry } from "./helpers/with-retry.util.js";
import { RedisOperationError, RedisNotInitializedError } from "./errors.js";
import type { IRedis, IRedisModule } from "./interfaces.js";
import type { RedisClientAdapter, RedisConfig, RedisState } from "./types.js";

class Redis implements IRedis {
  static #instance: Redis | null = null;

  #state: RedisState;

  private constructor(state: RedisState) {
    this.#state = state;
  }

  /**
   * Creates and stores the singleton instance with the given configuration.
   */
  static create = (config: RedisConfig): IRedis => {
    const merged: RedisConfig = {
      keyPrefix: DEFAULT_KEY_PREFIX,
      recordNamespace: DEFAULT_RECORD_NAMESPACE,
      defaultRecordTtlMs: DEFAULT_RECORD_TTL_SECONDS * 1000,
      maxRetryAttempts: DEFAULT_MAX_RETRY_ATTEMPTS,
      baseRetryDelayMs: DEFAULT_BASE_RETRY_DELAY_MS,
      ...config,
    };

    const state: RedisState = {
      client: null,
      config: merged,
    };

    const instance = new Redis(state);
    Redis.#instance = instance;
    return instance;
  };

  /**
   * Returns the previously created Redis singleton or throws if not initialized.
   */
  static getInstance = (): IRedis => {
    if (Redis.#instance === null) {
      throw new RedisNotInitializedError();
    }
    return Redis.#instance;
  };

  /**
   * Opens a Redis connection if it is not already connected.
   */
  connect = async (): Promise<void> => {
    if (this.#state.client !== null && this.#state.client.isOpen) {
      return;
    }

    const client = createClient({ url: this.#state.config.url });
    this.#state.client = client as unknown as RedisClientAdapter;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const connectPromise = client.connect();

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Redis connect timed out"));
        }, DEFAULT_CONNECT_TIMEOUT_MS);
      });

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (err) {
      this.#state.client = null;
      // Ensure we don't keep a broken client reference around.
      try {
        // Best-effort cleanup; avoid blocking callers on Redis shutdown timing.
        client.quit().catch(() => {});
      } catch {
        // Best-effort cleanup.
      }
      throw err;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  };

  isConnected = (): boolean => {
    return this.#state.client !== null && this.#state.client.isOpen;
  };

  /**
   * Closes the Redis connection and clears the singleton reference.
   */
  close = async (): Promise<void> => {
    if (Redis.#instance === this) {
      Redis.#instance = null;
    }

    const client = this.#state.client;
    this.#state.client = null;

    if (client !== null) {
      await client.quit();
    }
  };

  /**
   * Ensures there is an active Redis connection and returns the client.
   */
  #ensureClient = async (): Promise<RedisClientAdapter> => {
    if (this.#state.client === null) {
      await this.connect();
    } else if (!this.#state.client.isOpen) {
      await this.connect();
    }

    if (this.#state.client === null) {
      throw new RedisOperationError("Redis client is missing after connect");
    }

    return this.#state.client;
  };

  /**
   * Exposes a safe operation wrapper to higher-level modules.
   */
  withOperation = async <T>(fn: () => Promise<T>): Promise<T> => {
    const client = await this.#ensureClient();
    if (!client.isOpen) {
      throw new RedisOperationError("Redis is not connected");
    }

    return withRetry(fn, {
      maxRetryAttempts:
        this.#state.config.maxRetryAttempts ?? DEFAULT_MAX_RETRY_ATTEMPTS,
      baseRetryDelayMs:
        this.#state.config.baseRetryDelayMs ?? DEFAULT_BASE_RETRY_DELAY_MS,
    });
  };

  /**
   * Gives read-only access to the active Redis client.
   * Most callers should use `withOperation()` instead.
   */
  getClient = async (): Promise<RedisClientAdapter> => {
    return this.#ensureClient();
  };

  /**
   * Namespacing helpers for record storage.
   */
  buildRecordKey = (key: string): string => {
    const prefix = this.#state.config.keyPrefix ?? DEFAULT_KEY_PREFIX;
    const namespace =
      this.#state.config.recordNamespace ?? DEFAULT_RECORD_NAMESPACE;
    return `${prefix}:${namespace}:${key}`;
  };

  /**
   * Namespace prefix for record scans and bulk operations.
   */
  buildRecordKeyPrefix = (keyPrefix: string): string => {
    const prefix = this.#state.config.keyPrefix ?? DEFAULT_KEY_PREFIX;
    const namespace =
      this.#state.config.recordNamespace ?? DEFAULT_RECORD_NAMESPACE;
    return `${prefix}:${namespace}:${keyPrefix}`;
  };
}

const assertImplementsRedisModule = (redisModule: IRedisModule): void => {
  void redisModule;
};
assertImplementsRedisModule(Redis);

export { Redis };
