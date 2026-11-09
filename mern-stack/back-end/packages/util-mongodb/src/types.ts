import type { ZodType } from "zod";
import type { Logger } from "@util/logger";
import type { Db, ClientSession, TransactionOptions } from "mongodb";

import type { DocumentStatusValue } from "./constants.js";

type MongoDbConfig = {
  uri: string;
  database: string;
  logger?: Logger;
  connectTimeoutMs?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
};

type AutoFields = {
  status: DocumentStatusValue;
  createdAt: Date;
  updatedAt: Date;
};

type ValidationContext = {
  collection: string;
  operation: string;
  logger: Logger;
};

type CreateOneParams<T> = {
  collection: string;
  doc: T;
  schema?: ZodType<T>;
  session?: ClientSession;
};

type CreateManyParams<T> = {
  collection: string;
  docs: T[];
  schema?: ZodType<T>;
  ordered?: boolean;
  session?: ClientSession;
};

type FindOneParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  projection?: Record<string, 0 | 1>;
  schema?: ZodType<T>;
  session?: ClientSession;
};

type FindManyParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  projection?: Record<string, 0 | 1>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  schema?: ZodType<T>;
  session?: ClientSession;
};

type CountDocumentsParams = {
  collection: string;
  filter?: Record<string, unknown>;
  session?: ClientSession;
};

type DistinctParams<T> = {
  collection: string;
  field: string;
  filter?: Record<string, unknown>;
  schema?: ZodType<T>;
  session?: ClientSession;
};

type UpdateOneParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
  schema?: ZodType<T>;
  upsert?: boolean;
  session?: ClientSession;
};

type UpdateManyParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
  schema?: ZodType<T>;
  upsert?: boolean;
  session?: ClientSession;
};

type FindOneAndUpdateParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
  schema?: ZodType<T>;
  upsert?: boolean;
  session?: ClientSession;
};

type DeleteOneParams = {
  collection: string;
  filter: Record<string, unknown>;
  session?: ClientSession;
};

type DeleteManyParams = {
  collection: string;
  filter: Record<string, unknown>;
  session?: ClientSession;
};

type FindOneAndDeleteParams<T> = {
  collection: string;
  filter: Record<string, unknown>;
  schema?: ZodType<T>;
  session?: ClientSession;
};

type CreateOneResult = {
  insertedId: string;
  acknowledged: boolean;
};

type CreateManyResult = {
  insertedIds: string[];
  insertedCount: number;
  acknowledged: boolean;
};

type UpdateOneResult = {
  matchedCount: number;
  modifiedCount: number;
  upsertedId: string | null;
  acknowledged: boolean;
};

type UpdateManyResult = {
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  acknowledged: boolean;
};

type DeleteOneResult = {
  deletedCount: number;
  acknowledged: boolean;
};

type DeleteManyResult = {
  deletedCount: number;
  acknowledged: boolean;
};

type AggregateParams<T = unknown> = {
  collection: string;
  pipeline: Record<string, unknown>[];
  schema?: ZodType<T>;
  options?: { allowDiskUse?: boolean; maxTimeMs?: number };
  session?: ClientSession;
};

type WithTransactionOptions = {
  maxCommitTimeMs?: number;
  transactionOptions?: TransactionOptions;
};

type MongoDbState = {
  client: import("mongodb").MongoClient | null;
  db: Db | null;
  /** Promise for in-flight connect; concurrent callers await this instead of opening multiple connections. */
  connectPromise: Promise<void> | null;
  logger: Logger;
  config: MongoDbConfig;
};

export type {
  MongoDbConfig,
  AutoFields,
  ValidationContext,
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
  CreateOneResult,
  CreateManyResult,
  UpdateOneResult,
  UpdateManyResult,
  DeleteOneResult,
  DeleteManyResult,
  AggregateParams,
  WithTransactionOptions,
  MongoDbState,
};
