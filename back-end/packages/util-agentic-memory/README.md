# @util/agentic-memory

Framework-agnostic long-term memory package for agents. Defaults to MongoDB persistence, with pluggable storage adapters.

## Install

```bash
pnpm add @util/agentic-memory
```

## Configuration

| Option                                                                | Scope                  | Description                                                                                                                                                                                               |
| --------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mongo.mongoDb`                                                       | `create`               | **Alternative to `uri`/`database`:** pass the app’s existing `MongoDb` instance (e.g. from `getDb()` after startup). Does not call `MongoDb.create` again; `close()` will **not** disconnect this client. |
| `mongo.uri`                                                           | `AgenticMemory.create` | MongoDB connection string (from app env). Omit when using `mongo.mongoDb`.                                                                                                                                |
| `mongo.database`                                                      | `create`               | Database name. Must match any existing `MongoDb` singleton in the process (`uri` + `database`). Omit when using `mongo.mongoDb`.                                                                          |
| `mongo.collection`                                                    | `create`               | Collection name; default `agent_memory_entries`.                                                                                                                                                          |
| `mongo.connectTimeoutMs`, `maxPoolSize`, `minPoolSize`                | `create`               | Passed through to `@util/mongodb` (URI config only).                                                                                                                                                      |
| `mongo.closeConnectionOnClose`                                        | `create`               | If true, `close()` disconnects the shared Mongo client. Default **false**. Ignored when using `mongo.mongoDb`.                                                                                            |
| `adapter`                                                             | `create`               | Custom `MemoryStoreAdapter` instead of the default Mongo adapter.                                                                                                                                         |
| `hooks.beforeSave` / `afterSave` / `beforeRetrieve` / `afterRetrieve` | `create`               | Optional transforms around save and retrieve.                                                                                                                                                             |

Integration tests typically set `mongo.closeConnectionOnClose: true` in `afterAll` so the process can shut down cleanly.

**Using the app’s `MongoDb` instance** (recommended when the server already calls `MongoDb.create` / `connect`):

```typescript
import { MongoDb } from "@util/mongodb";
import { AgenticMemory, MemoryType } from "@util/agentic-memory";

const db = MongoDb.getInstance(); // after your bootstrap connected

const memory = AgenticMemory.create({
  mongo: { mongoDb: db },
});

await memory.saveMemory({
  agentId: "app-agent",
  type: MemoryType.FACT,
  payloadJson: { source: "shared-connection" },
});
```

## Quick Start

```typescript
import { AgenticMemory, MemoryType } from "@util/agentic-memory";

const memory = AgenticMemory.create({
  mongo: {
    uri: process.env.MONGODB_URI!,
    database: process.env.MONGODB_DATABASE!,
  },
});

await memory.saveMemory({
  agentId: "coding-agent",
  type: MemoryType.RULE,
  memoryKey: "commit.policy",
  importance: 10,
  payloadJson: { mode: "ask", message: "Ask before commit" },
});

const found = await memory.retrieveMemory({
  agentId: "coding-agent",
  query: "commit",
  topK: 5,
});
```

## How this connects to an agent

This package does **not** guess what should be remembered. Something in your stack must **decide** to persist and then call the API (or expose tools so a model can call them).

**1. Application-driven (you choose when)**  
Call `saveMemory` from your orchestration code whenever saving makes sense: after the user confirms a preference, when a pipeline extracts a durable fact, on session end, after `setCommitPolicy`, and so on. Same for `retrieveMemory` before a run if you want the agent to see prior context.

**2. Tool-calling agents (the model chooses when)**  
Register the memory tools with your agent runtime (OpenAI-style function calling, MCP, etc.) and describe them in the system or tool instructions so the model knows it _may_ save or look up memories during a turn.

```typescript
import { AgenticMemory, createMemoryTools } from "@util/agentic-memory";

const memory = AgenticMemory.create({ mongo: { uri, database } });
const tools = createMemoryTools(memory, {
  onAudit: (e) => {
    /* optional: log tool calls */
  },
});

// tools.save_memory, tools.retrieve_memory, tools.delete_memory
// Wire `tools` into your framework’s tool registry and pass tool results back to the model.
```

The tool handlers validate input with Zod and delegate to `saveMemory` / `retrieveMemory` / `deleteMemory`. Your prompts should say when to use them (for example: “Persist user preferences with `save_memory` when the user asks you to remember something.”).

### Example: dispatch by tool name

`createMemoryTools` returns functions keyed by snake_case names. A small router ties your runtime’s tool calls to those handlers:

```typescript
import {
  AgenticMemory,
  createMemoryTools,
  MemoryType,
} from "@util/agentic-memory";

const memory = AgenticMemory.create({
  mongo: {
    uri: process.env.MONGODB_URI!,
    database: process.env.MONGODB_DATABASE!,
  },
});

const handlers = createMemoryTools(memory);

/** Use this when tool names come from the model as plain strings (OpenAI, etc.). */
async function runMemoryTool(
  name: string,
  argsJson: unknown
): Promise<unknown> {
  switch (name) {
    case "save_memory":
      return handlers.save_memory(argsJson);
    case "retrieve_memory":
      return handlers.retrieve_memory(argsJson);
    case "delete_memory":
      return handlers.delete_memory(argsJson);
    default:
      throw new Error(`Unknown memory tool: ${name}`);
  }
}

// Example: model emitted tool call save_memory with JSON arguments
await runMemoryTool("save_memory", {
  agentId: "user-42-assistant",
  type: MemoryType.PREFERENCE,
  memoryKey: "editor",
  importance: 8,
  payloadJson: { theme: "dark", fontSize: 14 },
});
```

### Example: OpenAI-style `tools` list

Many SDKs accept a name, description, and JSON Schema for parameters. You can register three functions that match `createMemoryTools` (the model still calls the same `runMemoryTool` / handlers above):

```typescript
const openAiStyleTools = [
  {
    type: "function" as const,
    function: {
      name: "save_memory",
      description:
        "Persist or update a long-term memory for this agent. Use when the user asks to remember something or when a fact should survive future chats.",
      parameters: {
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "Partition id for this agent or session.",
          },
          type: { enum: ["preference", "rule", "fact", "context"] },
          memoryKey: {
            type: "string",
            description: "Stable idempotency key for upserts (optional).",
          },
          importance: { type: "integer", minimum: 1, maximum: 10 },
          payloadJson: { type: "object", additionalProperties: true },
          ttlMs: {
            type: "integer",
            minimum: 1,
            description: "Optional TTL in ms.",
          },
          expectedDocumentVersion: { type: "integer", minimum: 0 },
        },
        required: ["agentId", "type", "payloadJson"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "retrieve_memory",
      description: "Search this agent's stored memories before answering.",
      parameters: {
        type: "object",
        properties: {
          agentId: { type: "string" },
          query: { type: "string" },
          types: {
            type: "array",
            items: { enum: ["preference", "rule", "fact", "context"] },
          },
          topK: { type: "integer", minimum: 1 },
        },
        required: ["agentId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_memory",
      description:
        "Remove a memory by id (from a prior save or retrieve result).",
      parameters: {
        type: "object",
        properties: {
          agentId: { type: "string" },
          id: { type: "string", description: "Mongo document id string." },
        },
        required: ["agentId", "id"],
      },
    },
  },
];
```

Pass `openAiStyleTools` to your chat/completions client. When the response includes `tool_calls`, parse each call’s `function.arguments` as JSON and invoke `runMemoryTool(call.function.name, JSON.parse(call.function.arguments))`, append tool results to the conversation, and call the model again until it finishes without tools.

### Example: individual handlers

If you build tools one at a time (e.g. separate MCP resources), import the single functions:

```typescript
import {
  AgenticMemory,
  toolSaveMemory,
  toolRetrieveMemory,
  toolDeleteMemory,
} from "@util/agentic-memory";

const memory = AgenticMemory.getInstance();

await toolSaveMemory(
  memory,
  {
    agentId: "a1",
    type: MemoryType.FACT,
    payloadJson: { text: "API base URL is https://api.example.com" },
  },
  { onAudit: (e) => console.log(e) }
);
```

## Memory Types

- `MemoryType.PREFERENCE`
- `MemoryType.RULE`
- `MemoryType.FACT`
- `MemoryType.CONTEXT`

## API

- `AgenticMemory.create(config)`
- `AgenticMemory.getInstance()`
- `saveMemory(input)`
- `retrieveMemory(input)`
- `deleteMemory(input)`
- `close()`

### Policy helpers

- `setCommitPolicy(service, { agentId, mode, reason? })`
- `decideCommit(service, { agentId, defaultMode? })`

### Tool handlers

- `toolSaveMemory(service, input, hooks?)`
- `toolRetrieveMemory(service, input, hooks?)`
- `toolDeleteMemory(service, input, hooks?)`
- `createMemoryTools(service, hooks?)`

## Isolation Model

Memory is partitioned by `agentId`. One agent cannot see another agent's memories unless your application explicitly routes shared scope.

## How to test with your package `.env` (Mongo)

Integration tests use **only** `packages/util-agentic-memory/.env` — **not** `app/.env` or the repo root `.env`. The package `pnpm test` script sets `JEST_PACKAGE_ENV=util-agentic-memory` so `jest.setup.cjs` loads that single file (see repo root `jest.setup.cjs`).

1. Copy `test.env` to **`.env`** in this package directory (or create `.env` yourself).
2. Set at least **`MONGODB_URI`** or **`MONGO_URI`**, and optionally **`MONGODB_DATABASE`** or **`AGENTIC_MEMORY_MONGODB_DATABASE`** (defaults to `agentic_memory_test`).
3. From **this package** run:

```bash
pnpm test
```

From the repo root while keeping the same package-only env behavior:

```bash
cd packages/util-agentic-memory && pnpm test
```

or:

```bash
JEST_PACKAGE_ENV=util-agentic-memory pnpm exec jest --config jest.config.cjs --testPathPatterns="packages/util-agentic-memory" --forceExit
```

Do **not** rely on the main application’s `.env` for these tests.

## Test Docker

```bash
docker run -d --name agentic-memory-mongo-test -p 27017:27017 mongo:7
```

Example local URI after Docker: `mongodb://127.0.0.1:27017`
