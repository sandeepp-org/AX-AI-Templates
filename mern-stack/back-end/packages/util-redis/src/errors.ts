class RedisNotInitializedError extends Error {
  code = "REDIS_NOT_INITIALIZED" as const;

  constructor(message = "Redis not initialized. Call Redis.create() first.") {
    super(message);
    this.name = "RedisNotInitializedError";
  }
}

class RedisOperationError extends Error {
  code = "REDIS_OPERATION_ERROR" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RedisOperationError";
  }
}

class RecordStoreError extends Error {
  code = "RECORD_STORE_ERROR" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RecordStoreError";
  }
}

export { RedisNotInitializedError, RedisOperationError, RecordStoreError };
