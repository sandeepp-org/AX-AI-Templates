import type { Logger } from "@util/logger";
import type { Db } from "mongodb";
import type { AggregateParams } from "../types.js";

import { DocumentStatus } from "../constants.js";
import { validateWithSchema } from "../helpers/validate-params.util.js";

const mergeStatusIntoMatch = (
  pipeline: Record<string, unknown>[]
): Record<string, unknown>[] => {
  if (pipeline.length === 0) {
    return [{ $match: { status: DocumentStatus.ACTIVE } }];
  }

  const first = pipeline[0] as Record<string, unknown>;
  if (first.$match != null && typeof first.$match === "object") {
    const match = first.$match as Record<string, unknown>;
    const merged = {
      status: DocumentStatus.ACTIVE,
      ...match,
    };
    return [{ $match: merged }, ...pipeline.slice(1)];
  }

  return [{ $match: { status: DocumentStatus.ACTIVE } }, ...pipeline];
};

const aggregate = async <T>(
  db: Db,
  logger: Logger,
  params: AggregateParams<T>
): Promise<T[]> => {
  const startTime = Date.now();
  logger.debug("CRUD operation start", {
    collection: params.collection,
    operation: "aggregate",
    pipelineLength: params.pipeline.length,
  });

  const pipeline = mergeStatusIntoMatch(params.pipeline);
  const collection = db.collection(params.collection);

  const aggregateOpts: import("mongodb").AggregateOptions = {};
  if (params.options?.allowDiskUse === true) aggregateOpts.allowDiskUse = true;
  if (params.options?.maxTimeMs != null)
    aggregateOpts.maxTimeMS = params.options.maxTimeMs;
  if (params.session) {
    aggregateOpts.session = params.session;
  }

  const raw = await collection
    .aggregate(pipeline as import("mongodb").Document[], aggregateOpts)
    .toArray();

  const result = params.schema
    ? raw.map((doc) =>
        validateWithSchema(doc, params.schema!, {
          collection: params.collection,
          operation: "aggregate",
          logger,
        })
      )
    : (raw as T[]);

  const durationMs = Date.now() - startTime;
  logger.debug("CRUD operation success", {
    collection: params.collection,
    operation: "aggregate",
    durationMs,
    count: result.length,
  });

  return result;
};

export { aggregate, mergeStatusIntoMatch };
