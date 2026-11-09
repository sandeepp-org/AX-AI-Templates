# @utils/mongodb

Typed MongoDB CRUD with the native driver, Zod validation, auto-managed fields (status, createdAt, updatedAt), soft deletes, and aggregate support.

## Install

```bash
pnpm add @utils/mongodb
```

Dependencies: `mongodb`, `zod`, `@utils/logger`. The app supplies config (uri, database); the package does not load env.

## Quick Start

```typescript
import { z } from "zod";
import { MongoDb } from "@utils/mongodb";

const db = MongoDb.create({
  uri: process.env.MONGODB_URI!,
  database: process.env.MONGODB_DATABASE!,
});

await db.connect();

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

await db.createOne({
  collection: "users",
  doc: { name: "Alice", email: "alice@example.com" },
  schema: UserSchema,
});

const user = await db.findOne({
  collection: "users",
  filter: { email: "alice@example.com" },
  schema: UserSchema,
});

await db.close();
```

## Infrastructure setup

The app is responsible for configuring and running MongoDB; this package only consumes the connection details.

- **Local development:**
  - Run MongoDB via Docker:
    ```bash
    docker run -d --name nexus-mongodb-dev -p 27017:27017 mongo:7
    ```
  - Typical env wiring in the app:
    ```bash
    export MONGODB_URI="mongodb://localhost:27017"
    export MONGODB_DATABASE="nexus_dev"
    ```
- **CI / ephemeral environments:**
  - Use the same Docker pattern, or a managed test instance.
  - Point `MONGODB_URI` and `MONGODB_DATABASE` at the ephemeral database.
- **Production (examples):**
  - MongoDB Atlas, self-managed replica set, or cloud-provider equivalent.
  - Set `MONGODB_URI` to the SRV or connection string provided by the platform.
  - Configure credentials and SSL per your security policies; do **not** hardcode them in code.

For secrets (user/password, SRV, TLS options), prefer an external secret manager (for example `@util/secret-manager-aws`) and resolve them in the app before calling `MongoDb.create({ uri, database })`.

## Singleton

```typescript
const db = MongoDb.create({ uri, database });
await db.connect();

const same = MongoDb.getInstance();
```

## API

### Connection

| Method             | Description                                    |
| ------------------ | ---------------------------------------------- |
| `create(config)`   | Create (and set) singleton instance.           |
| `getInstance()`    | Return current singleton.                      |
| `connect()`        | Open connection pool.                          |
| `close()`          | Close connection and clear singleton.          |
| `isConnected()`    | Whether connected.                             |
| `collection(name)` | Escape hatch — raw native `Collection`.        |
| `startSession()`   | Start a MongoDB `ClientSession` on the client. |
| `withTransaction`  | Run an async callback inside a transaction.    |

### Create

| Method               | Description                               |
| -------------------- | ----------------------------------------- |
| `createOne(params)`  | Insert one document; optional Zod schema. |
| `createMany(params)` | Insert many; optional schema, `ordered`.  |

### Read

| Method                   | Description                                 |
| ------------------------ | ------------------------------------------- |
| `findOne(params)`        | One document; optional projection, schema.  |
| `findMany(params)`       | Many with sort/limit/skip; optional schema. |
| `countDocuments(params)` | Count active documents.                     |
| `distinct(params)`       | Distinct values for a field.                |

### Update

| Method                     | Description                         |
| -------------------------- | ----------------------------------- |
| `updateOne(params)`        | Update one; optional upsert.        |
| `updateMany(params)`       | Update many.                        |
| `findOneAndUpdate(params)` | Update and return document (after). |

### Delete (soft)

| Method                     | Description                      |
| -------------------------- | -------------------------------- |
| `deleteOne(params)`        | Soft-delete one (sets status 0). |
| `deleteMany(params)`       | Soft-delete many.                |
| `findOneAndDelete(params)` | Soft-delete and return document. |

### Aggregate

| Method              | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `aggregate(params)` | Run pipeline; status filter auto-applied; optional schema on output. |

## Transactions

Use `withTransaction` to execute multiple operations as a single atomic unit. The callback receives a `ClientSession`; pass it to any CRUD/aggregate method via the `session` field on params.

```typescript
await db.withTransaction(async (session) => {
  await db.createOne({
    collection: "users",
    doc: { name: "TxnUser", email: "txn@example.com" },
    session,
  });

  await db.updateOne({
    collection: "users",
    filter: { name: "TxnUser" },
    update: { $set: { email: "txn-updated@example.com" } },
    session,
  });
});

// After commit, both operations are visible:
const user = await db.findOne({
  collection: "users",
  filter: { name: "TxnUser" },
});
```

All CRUD and aggregate methods accept an optional `session?: ClientSession`, so you can also use a manually created session when needed.

## Config

| Field              | Type   | Description                           |
| ------------------ | ------ | ------------------------------------- |
| `uri`              | string | MongoDB connection string (required). |
| `database`         | string | Database name (required).             |
| `logger`           | Logger | Optional @utils/logger instance.      |
| `connectTimeoutMs` | number | Connection timeout (default 10000).   |
| `maxPoolSize`      | number | Max pool size (default 10).           |
| `minPoolSize`      | number | Min pool size (default 1).            |

## Auto-managed fields

| Field       | On create  | On update   |
| ----------- | ---------- | ----------- |
| `status`    | 1 (active) | Not touched |
| `createdAt` | Now        | Not touched |
| `updatedAt` | Now        | Now         |

Reads and updates automatically filter by `status: 1`. Soft deletes set `status: 0`.

## Optimistic concurrency

Include `updatedAt` in the filter for conflict detection. If the document was modified since, throws `MongoDbConflictError`.

## Errors

| Class                    | When                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `MongoDbValidationError` | Zod validation fails (`.issues`, `.collection`, `.operation`). |
| `MongoDbConflictError`   | Optimistic concurrency conflict.                               |

## Package structure

```
packages/utils-mongodb/
├── docs/plan.md
├── src/
│   ├── helpers/   (auto-fields, validate-params, build-options)
│   ├── operations/ (connect, create, read, update, delete, aggregate)
│   ├── constants.ts, types.ts, errors.ts
│   ├── mongo-db.ts, index.ts
├── test.env
├── package.json, tsconfig.json
├── README.md, SKILL.md
```

## Scripts

- `pnpm build` — compile
- `pnpm test` — Jest
- `pnpm typecheck` — tsc --noEmit
- `pnpm clean` — remove dist

## Test Docker

```bash
docker run -d --name nexus-mongodb-test -p 27017:27017 mongo:7
```
