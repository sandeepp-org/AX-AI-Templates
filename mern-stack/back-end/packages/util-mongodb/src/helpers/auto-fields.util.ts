import type { AutoFields } from "../types.js";

import { DocumentStatus } from "../constants.js";

/**
 * Adds status and timestamp fields to a single document while preserving existing values.
 */
const applyCreateFields = <T extends Record<string, unknown>>(
  doc: T
): T & AutoFields => {
  const now = new Date();

  return {
    status: DocumentStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...doc,
  } as T & AutoFields;
};

/**
 * Adds status and timestamp fields to every document in the provided array.
 */
const applyCreateFieldsMany = <T extends Record<string, unknown>>(
  docs: T[]
): (T & AutoFields)[] => {
  return docs.map((doc) => applyCreateFields(doc));
};

/**
 * Ensures an updatedAt timestamp is present in the $set portion of an update document.
 */
const applyUpdateFields = (
  update: Record<string, unknown>
): Record<string, unknown> => {
  const $set = (update.$set ?? {}) as Record<string, unknown>;

  const mergedSet = {
    updatedAt: new Date(),
    ...$set,
  };

  return {
    ...update,
    $set: mergedSet,
  };
};

/**
 * Enforces the active status filter on read/update/delete filters.
 */
const applyActiveFilter = (
  filter: Record<string, unknown>
): Record<string, unknown> => {
  return {
    status: DocumentStatus.ACTIVE,
    ...filter,
  };
};

/**
 * Builds the update document used to perform a soft delete (status inactive + updatedAt).
 */
const buildSoftDeleteUpdate = (): Record<string, unknown> => {
  return {
    $set: {
      status: DocumentStatus.INACTIVE,
      updatedAt: new Date(),
    },
  };
};

export {
  applyCreateFields,
  applyCreateFieldsMany,
  applyUpdateFields,
  applyActiveFilter,
  buildSoftDeleteUpdate,
};
