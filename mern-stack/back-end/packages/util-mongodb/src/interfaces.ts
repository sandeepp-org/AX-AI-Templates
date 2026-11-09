import type { Collection, ClientSession } from "mongodb";

import type {
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

interface MongoDbContract {
  connect: () => Promise<void>;
  close: () => Promise<void>;
  isConnected: () => boolean;
  collection: (name: string) => Collection;
  startSession: () => Promise<ClientSession>;
  withTransaction: <T>(
    operation: (session: ClientSession) => Promise<T>,
    options?: WithTransactionOptions
  ) => Promise<T>;
  createOne: <T extends Record<string, unknown>>(
    params: CreateOneParams<T>
  ) => Promise<CreateOneResult>;
  createMany: <T extends Record<string, unknown>>(
    params: CreateManyParams<T>
  ) => Promise<CreateManyResult>;
  findOne: <T>(params: FindOneParams<T>) => Promise<T | null>;
  findMany: <T>(params: FindManyParams<T>) => Promise<T[]>;
  countDocuments: (params: CountDocumentsParams) => Promise<number>;
  distinct: <T>(params: DistinctParams<T>) => Promise<T[]>;
  updateOne: <T>(params: UpdateOneParams<T>) => Promise<UpdateOneResult>;
  updateMany: <T>(params: UpdateManyParams<T>) => Promise<UpdateManyResult>;
  findOneAndUpdate: <T>(params: FindOneAndUpdateParams<T>) => Promise<T | null>;
  deleteOne: (params: DeleteOneParams) => Promise<DeleteOneResult>;
  deleteMany: (params: DeleteManyParams) => Promise<DeleteManyResult>;
  findOneAndDelete: <T>(params: FindOneAndDeleteParams<T>) => Promise<T | null>;
  aggregate: <T = unknown>(params: AggregateParams<T>) => Promise<T[]>;
}

export type { MongoDbContract };
