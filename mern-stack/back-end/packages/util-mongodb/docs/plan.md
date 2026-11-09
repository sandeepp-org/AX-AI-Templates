# @util/mongodb — Design Plan

## Overview

Typed MongoDB CRUD package using the **native `mongodb` driver** and **Zod**. Collection-based API: no ORM; one clear set of methods for all collections. Auto-managed fields, soft delete, optimistic concurrency, and aggregate support.

## Goals

1. **Native driver** — Use `mongodb` (no Mongoose); smaller surface, no ORM lock-in.
2. **Zod validation** — Optional schema on create/read/update; validate input and output.
3. **Collection-based API** — Every method takes `collection` (and filter/doc/etc.); same API for all collections.
4. **Auto-managed fields** — `status`, `createdAt`, `updatedAt` injected on write; reads filter by active status.
5. **Soft delete** — Deletes set `status: 0`; no hard deletes.
6. **Optimistic concurrency** — `updatedAt` in filter triggers conflict check.
7. **Aggregate** — `aggregate({ collection, pipeline, schema?, options? })` with status filter.
8. **Logging** — Optional @util/logger; connection and CRUD logging.
9. **No env in package** — Config from app.

## Architecture

- **MongoDb** class: singleton; holds client, db, logger, config; delegates to operation functions.
- **Operations** (connect, create, read, update, delete, aggregate): stateless functions taking `db`, `logger`, `params`.
- **Helpers**: auto-fields, validate-params (Zod), build-options (map to driver options).
- **Escape hatch**: `collection(name)` returns native `Collection`.

## Folder structure

```
packages/util-mongodb/
  docs/
    plan.md
  src/
    helpers/
      auto-fields.util.ts
      auto-fields.util.test.ts
      build-options.util.ts
      build-options.util.test.ts
      validate-params.util.ts
      validate-params.util.test.ts
    operations/
      connect.ts
      connect.test.ts
      create.ts
      read.ts
      update.ts
      delete.ts
      aggregate.ts
    constants.ts
    types.ts
    errors.ts
    mongo-db.ts
    index.ts
  test.env
  tsconfig.json
  package.json
  SKILL.md
  README.md
```

## Public API

- **Connection:** `create(config)`, `getInstance()`, `connect()`, `close()`, `isConnected()`, `collection(name)`, `startSession()`, `withTransaction(operation, options?)`.
- **Create:** `createOne`, `createMany`.
- **Read:** `findOne`, `findMany`, `countDocuments`, `distinct`.
- **Update:** `updateOne`, `updateMany`, `findOneAndUpdate`.
- **Delete (soft):** `deleteOne`, `deleteMany`, `findOneAndDelete`.
- **Aggregate:** `aggregate({ collection, pipeline, schema?, options?, session? })`.

All CRUD params include `collection`, optional `schema?: ZodType<T>`, and optional `session?: ClientSession`. Config: `uri`, `database` (required), `logger?`, `connectTimeoutMs?`, `maxPoolSize?`, `minPoolSize?`.

## Testing

- **Jest** (monorepo standard). Tests under `src/**/*.test.ts`.
- **Connect:** connect/close/isConnected/getInstance; skip when MongoDB unreachable (e.g. ECONNREFUSED).
- **Helpers:** auto-fields, validate-params, build-options (unit).
- **Operations:** create/read/update/delete/aggregate with real MongoDB or skip when unavailable.
- **test.env:** `MONGODB_URI`, `MONGODB_DATABASE` for local/CI.

## App integration

- App calls `MongoDb.create({ uri, database, logger })` and `db.connect()` at bootstrap; config comes from app env (package does not load dotenv).
- Use `getDb().findOne({ collection: "users", filter, schema })` etc.; define Zod schemas in app (e.g. `user.schema.ts`).
- On shutdown, call `getDb().close()`.

## Problem Definition

Every Nexus service that stores data in MongoDB reimplements connection management, document validation, soft-delete conventions, and audit-field injection. This leads to inconsistent document shapes, missing status filters, and duplicated boilerplate. `@util/mongodb` provides a single collection-based API that handles all of this automatically.

## Phases

| Phase | Description                                                     | Status    |
| ----- | --------------------------------------------------------------- | --------- |
| 1     | MongoDb singleton + connect/close/isConnected                   | Completed |
| 2     | createOne/createMany with auto-fields + Zod validation          | Completed |
| 3     | findOne/findMany/countDocuments/distinct with active filter     | Completed |
| 4     | updateOne/updateMany/findOneAndUpdate + concurrency checks      | Completed |
| 5     | Soft delete: deleteOne/deleteMany/findOneAndDelete              | Completed |
| 6     | Aggregate with status filter merge                              | Completed |
| 7     | Helper unit tests (auto-fields, validate-params, build-options) | Completed |
| 8     | Connection + singleton lifecycle tests                          | Completed |
| 9     | Transactions: sessions + withTransaction helper                 | Completed |

## Test Plan

### Connection + singleton lifecycle

- `create()` returns instance, `getInstance()` returns same
- `connect()` opens connection, `close()` closes it, `isConnected()` reflects state
- `close()` clears singleton, `getInstance()` throws after close
- `collection()` throws when not connected
- `create()` after `close()` reinitializes cleanly

### Helpers (unit — no MongoDB required)

- `applyCreateFields`: injects status, createdAt, updatedAt; consumer values preserved
- `applyCreateFieldsMany`: applies to array
- `applyUpdateFields`: injects updatedAt into `$set`; consumer values preserved
- `applyActiveFilter`: injects status=ACTIVE; consumer values preserved
- `buildSoftDeleteUpdate`: returns `$set` with status=INACTIVE and updatedAt
- `buildFindOptions`: maps projection, sort, limit, skip
- `buildUpdateOptions`: maps upsert
- `validateWithSchema`: returns parsed data on valid; throws MongoDbValidationError on invalid
- `validateManyWithSchema`: validates array; aggregates issues with indices

### CRUD operations (requires running MongoDB)

- `createOne`: inserts document with auto-fields
- `createMany`: bulk inserts
- `findOne`: finds active document, respects projection/schema
- `findMany`: finds with sort/limit/skip
- `countDocuments`: counts active documents
- `distinct`: returns distinct field values
- `updateOne`: updates with concurrency check
- `updateMany`: bulk updates
- `findOneAndUpdate`: updates and returns document
- `deleteOne`: soft-deletes (sets status=0)
- `deleteMany`: soft-deletes many
- `findOneAndDelete`: soft-deletes and returns document
- `aggregate`: runs pipeline with status filter
- `withTransaction`: commits multiple operations together; rolls back on error

## Decision Log

| #   | Question                | Decision                                                      | Date |
| --- | ----------------------- | ------------------------------------------------------------- | ---- |
| 1   | ORM vs native driver    | Native `mongodb` driver + Zod — no ORM lock-in                | --   |
| 2   | Connection management   | Singleton with single connection pool                         | --   |
| 3   | Delete strategy         | Soft delete only — status filter on all reads/updates/deletes | --   |
| 4   | Validation              | Optional Zod schema per call; throws MongoDbValidationError   | --   |
| 5   | Aggregate status filter | Auto-prepend/merge status=ACTIVE into first `$match`          | --   |
| 6   | Config loading          | Config from app; no dotenv in package                         | --   |
