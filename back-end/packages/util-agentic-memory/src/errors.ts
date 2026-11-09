import type { ZodError } from "zod";

class AgenticMemoryNotInitializedError extends Error {
  constructor() {
    super("AgenticMemory not initialized. Call AgenticMemory.create() first.");
    this.name = "AgenticMemoryNotInitializedError";
  }
}

class MemoryVersionConflictError extends Error {
  constructor() {
    super("Memory document version conflict.");
    this.name = "MemoryVersionConflictError";
  }
}

class MongoMemorySingletonConflictError extends Error {
  constructor() {
    super(
      "MongoDb is already initialized with a different uri/database. Reuse the existing AgenticMemory or share one Mongo connection for the process."
    );
    this.name = "MongoMemorySingletonConflictError";
  }
}

class MemoryToolValidationError extends Error {
  readonly zodError: ZodError;

  constructor(message: string, zodError: ZodError) {
    super(message);
    this.name = "MemoryToolValidationError";
    this.zodError = zodError;
  }
}

export {
  AgenticMemoryNotInitializedError,
  MemoryVersionConflictError,
  MongoMemorySingletonConflictError,
  MemoryToolValidationError,
};
