---
name: util-mongodb
description: Native MongoDB driver with singleton pattern, collection-based CRUD, Zod schema validation, soft delete, and aggregation. Use when the app needs to read/write MongoDB documents.
metadata:
  author: aatmix
  version: "0.1.0"
  path: packages/util-mongodb
---

# @util/mongodb

Native MongoDB driver with typed CRUD, Zod validation, and soft delete for Node.js/TypeScript projects.

For full API reference see [README.md](./README.md).

## When to Use

Use this package when you need:

- Singleton MongoDB connection via `MongoDb.create()` / `getInstance()`
- Collection-based CRUD (all methods take `collection` name + params)
- Optional Zod schema validation on read/write
- Automatic status, createdAt, updatedAt fields
- Soft delete (status 0) with active-only reads by default
- Aggregation pipeline support with optional status filter
- Raw driver access via `collection(name)` escape hatch

## Workspace Usage (Nexus monorepo)

```bash
pnpm add @util/mongodb --filter app
```

## Quick Usage

```typescript
import { MongoDb } from "@util/mongodb";

await MongoDb.create({ uri: process.env.MONGODB_URI, database: "mydb" });
const db = MongoDb.getInstance();

const user = await db.findOne({ collection: "users", filter: { _id: id } });
await db.insertOne({ collection: "users", document: { name: "Alice" } });
```

## Conventions

- App provides config (uri, database); package does not load env.
- Use Zod schemas for input/output validation where needed.
- For conflict detection, include `updatedAt` in update filters.

## Rules

- Connection strings must come from environment variables (passed from app), never hardcoded.
- Call `await MongoDb.create(config)` before `getInstance()` — `create()` is async.
