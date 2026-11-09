import type {
  MongoDbConfig,
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
} from "./types.js";
import type { MongoDbContract } from "./interfaces.js";

import { MongoDb } from "./mongo-db.js";
import { DocumentStatus } from "./constants.js";
import { MongoDbValidationError, MongoDbConflictError } from "./errors.js";

export {
  MongoDb,
  DocumentStatus,
  MongoDbValidationError,
  MongoDbConflictError,
};

export type {
  MongoDbConfig,
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
  MongoDbContract,
};
