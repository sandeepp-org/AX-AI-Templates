import type { Logger } from "@util/logger";
import type { Db } from "mongodb";
import type {
  FindOneParams,
  FindManyParams,
  CountDocumentsParams,
  DistinctParams,
} from "../types.js";

import { validateWithSchema } from "../helpers/validate-params.util.js";
import { buildFindOptions } from "../helpers/build-options.util.js";
import { applyActiveFilter } from "../helpers/auto-fields.util.js";

/**
 * Finds a single active document matching the filter and optionally parses it with a Zod schema.
 */
const findOne = async <T>(
  db: Db,
  logger: Logger,
  params: FindOneParams<T>
): Promise<T | null> => {
  const startTime = Date.now();
  logger.debug("CRUD operation start", {
    collection: params.collection,
    operation: "findOne",
    filter: params.filter,
  });

  const activeFilter = applyActiveFilter(params.filter);
  const collection = db.collection(params.collection);

  const options: Record<string, unknown> = {};
  if (params.projection) {
    options.projection = params.projection;
  }
  if (params.session) {
    options.session = params.session;
  }

  const doc = await collection.findOne(activeFilter, options);

  const result =
    doc === null
      ? null
      : params.schema
        ? validateWithSchema(doc, params.schema, {
            collection: params.collection,
            operation: "findOne",
            logger,
          })
        : (doc as T);

  const durationMs = Date.now() - startTime;
  logger.debug("CRUD operation success", {
    collection: params.collection,
    operation: "findOne",
    durationMs,
    found: result !== null,
  });

  return result;
};

/**
 * Finds multiple active documents matching the filter with optional projection, sorting, and paging.
 */
const findMany = async <T>(
  db: Db,
  logger: Logger,
  params: FindManyParams<T>
): Promise<T[]> => {
  const startTime = Date.now();
  logger.debug("CRUD operation start", {
    collection: params.collection,
    operation: "findMany",
    filter: params.filter,
  });

  const activeFilter = applyActiveFilter(params.filter);
  const collection = db.collection(params.collection);
  const findOptions = buildFindOptions({ ...params, filter: activeFilter });
  if (params.session) {
    (findOptions as Record<string, unknown>).session = params.session;
  }

  const docs = await collection.find(activeFilter, findOptions).toArray();

  const result = params.schema
    ? docs.map((doc) =>
        validateWithSchema(doc, params.schema!, {
          collection: params.collection,
          operation: "findMany",
          logger,
        })
      )
    : (docs as T[]);

  const durationMs = Date.now() - startTime;
  logger.debug("CRUD operation success", {
    collection: params.collection,
    operation: "findMany",
    durationMs,
    count: result.length,
  });

  return result;
};

/**
 * Counts active documents in the collection that satisfy the provided filter.
 */
const countDocuments = async (
  db: Db,
  logger: Logger,
  params: CountDocumentsParams
): Promise<number> => {
  const startTime = Date.now();
  logger.debug("CRUD operation start", {
    collection: params.collection,
    operation: "countDocuments",
    filter: params.filter,
  });

  const activeFilter = applyActiveFilter(params.filter ?? {});
  const collection = db.collection(params.collection);
  const count = await collection.countDocuments(activeFilter, {
    session: params.session,
  });

  const durationMs = Date.now() - startTime;
  logger.debug("CRUD operation success", {
    collection: params.collection,
    operation: "countDocuments",
    durationMs,
    count,
  });

  return count;
};

/**
 * Returns distinct values for a field across active documents that match the filter.
 */
const distinct = async <T>(
  db: Db,
  logger: Logger,
  params: DistinctParams<T>
): Promise<T[]> => {
  const startTime = Date.now();
  logger.debug("CRUD operation start", {
    collection: params.collection,
    operation: "distinct",
    field: params.field,
    filter: params.filter,
  });

  const activeFilter = applyActiveFilter(params.filter ?? {});
  const collection = db.collection(params.collection);
  const values = await collection.distinct(params.field, activeFilter, {
    session: params.session,
  });

  const result = params.schema
    ? values.map((val) =>
        validateWithSchema(val, params.schema!, {
          collection: params.collection,
          operation: "distinct",
          logger,
        })
      )
    : (values as T[]);

  const durationMs = Date.now() - startTime;
  logger.debug("CRUD operation success", {
    collection: params.collection,
    operation: "distinct",
    durationMs,
    count: result.length,
  });

  return result;
};

export { findOne, findMany, countDocuments, distinct };
