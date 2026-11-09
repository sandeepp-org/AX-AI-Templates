# @util/logger

Fast, multi-transport logger built on [Winston](https://github.com/winstonjs/winston) for the Nexus monorepo.

`Logger` is a singleton-friendly class that declaratively wires console, file, and MongoDB transports. Each transport can have its own log level.

## Install

```bash
pnpm add @util/logger
```

If you use the MongoDB transport, install the peer dependency:

```bash
pnpm add mongodb    # for MongoDB transport
```

## Quick Start

```typescript
import { Logger } from "@util/logger";

await Logger.create({
  level: "info",
  context: "AppBootstrap",
  transports: [{ type: "console", format: "simple" }],
});

const logger = Logger.getInstance();
logger.info("Server started on port 3000");
logger.error("Unhandled rejection", { err });
```

## Singleton

```typescript
import { Logger } from "@util/logger";

// Bootstrap: await create() initializes and stores the singleton.
await Logger.create({
  level: "info",
  transports: [{ type: "console", format: "simple" }],
});

// Elsewhere in the app -- retrieve the same instance.
const logger = Logger.getInstance();
```

## Multi-Transport

Each transport accepts its own `level` to override the top-level minimum. The top-level `level` sets the floor -- a transport cannot receive logs below it, but can set a higher threshold. In the example below, console receives everything from `debug` up, file stores `info`+, and MongoDB captures only `error`+.

```typescript
import { Logger } from "@util/logger";

await Logger.create({
  level: "debug",
  redact: ["password", "req.headers.authorization"],
  transports: [
    { type: "console", format: "json", level: "debug" },
    {
      type: "file",
      filename: "./logs/app.log",
      format: "json",
      level: "info",
    },
    {
      type: "mongodb",
      uri: process.env.MONGODB_URI!,
      collection: "logs",
      level: "error",
    },
  ],
});
```

## Child Loggers

```typescript
const reqLogger = logger.child({ requestId: req.id, userId: req.user?.id });
reqLogger.info("Processing order");
reqLogger.warn("Inventory low", { sku: "WIDGET-42", remaining: 3 });
// => { ..., requestId: "abc-123", userId: "u-42", sku: "WIDGET-42", remaining: 3, msg: "Inventory low" }
```

## Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  await logger.close();
  process.exit(0);
});
```

## API

### `Logger` class

| Method / Property                                  | Signature                                               | Description                                                              |
| -------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Logger.create(config?)`                           | `(config?: LoggerConfig) => Promise<Logger>`            | Creates a new logger instance and stores it as the singleton             |
| `Logger.getInstance()`                             | `() => Logger`                                          | Returns the singleton instance; throws if `create()` has not been called |
| `trace`, `debug`, `info`, `warn`, `error`, `fatal` | `(msg: string, data?: Record<string, unknown>) => void` | Standard log-level methods                                               |
| `child(bindings)`                                  | `(bindings: Record<string, unknown>) => Logger`         | Creates a child logger with merged bindings                              |
| `level`                                            | `LogLevel` (get/set)                                    | Read or change the minimum log level at runtime                          |
| `close()`                                          | `() => Promise<void>`                                   | Flushes all transports and ends the transport stream                     |

**LoggerConfig:**

| Field         | Type                      | Default                 | Description                                 |
| ------------- | ------------------------- | ----------------------- | ------------------------------------------- |
| `level`       | `LogLevel`                | `"info"`                | Minimum log level                           |
| `context`     | `string`                  | --                      | Persistent context label added to every log |
| `redact`      | `string[]`                | --                      | Paths to redact (e.g. `["password"]`)       |
| `timestamp`   | `boolean`                 | `true`                  | Include timestamp                           |
| `defaultMeta` | `Record<string, unknown>` | --                      | Default metadata for all logs               |
| `transports`  | `TransportConfig[]`       | `[{ type: "console" }]` | Array of transport configurations           |

## Transport Reference

### Console

```typescript
{ type: "console", format?: "simple" | "json", level?: LogLevel }
```

- `format` defaults to `"simple"` (human-readable). Use `"json"` for structured output.

### File

```typescript
{ type: "file", filename: string, format?: "simple" | "json", level?: LogLevel }
```

- Uses Winston's built-in File transport.
- `filename` is the path to the log file (directory is created if needed).
- `format` defaults to `"simple"`. Use `"json"` for structured output.

### MongoDB

```typescript
{ type: "mongodb", uri: string, collection?: string, storeHost?: boolean, level?: LogLevel }
```

- Requires `mongodb` as a peer dependency.
- `collection` defaults to `"log"`.
- **Custom levels:** When using custom levels (trace, fatal, etc.), the transport's `level` filter may interact unexpectedly with winston-mongodb's internal ordering. Prefer standard levels (`info`, `warn`, `error`) for MongoDB transport or avoid per-transport `level` overrides when using custom levels.

## Log Levels

| Level    | Numeric | Usage                      |
| -------- | ------- | -------------------------- |
| `trace`  | 5       | Fine-grained debugging     |
| `debug`  | 4       | Debugging information      |
| `info`   | 3       | Normal operation           |
| `warn`   | 2       | Potential issues           |
| `error`  | 1       | Errors that need attention |
| `fatal`  | 0       | Unrecoverable errors       |
| `silent` | --      | Disables logging           |

## Package Structure

```
packages/util-logger/
├── docs/
│   └── plan.md
├── src/
│   ├── transports/
│   │   ├── console.transport.ts
│   │   ├── file.transport.ts
│   │   └── mongodb.transport.ts
│   ├── constants.ts
│   ├── helpers/
│   │   └── build-transports.util.ts
│   ├── types.ts
│   ├── interfaces.ts
│   ├── logger.ts
│   ├── logger.test.ts
│   └── index.ts
├── test.env
├── tsconfig.json
├── package.json
├── SKILL.md
└── README.md
```

## Scripts

```bash
pnpm build
pnpm test
pnpm test:integration   # Run DB integration tests (requires env vars)
pnpm lint
```

## Test Dockers

Integration tests require MongoDB. Set env vars and run `pnpm test:integration`:

```sh
docker run -d --name mongodb -p 27017:27017 mongo:7

# Then: MONGODB_URI=mongodb://localhost:27017/test pnpm test:integration
```

## Monorepo template sync

From the repository root, use `pnpm template:ensure`, `template:add`, `template:update`, or `template:pr` (see root `package.json`) to pull packages from upstream or open a PR with `packages/*` changes.
