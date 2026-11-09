---
name: util-logger
description: Fast, multi-transport structured logger (console, File, MongoDB). Built on Winston with a class-based Logger exposing static factory and singleton methods. Use when the user needs logging with any combination of console, file, or MongoDB output.
metadata:
  author: aatmix
  version: "0.1.0"
  path: packages/util-logger
---

# @util/logger

Fast, multi-transport structured logger for Node.js/TypeScript projects.

For full API reference, transport options, and config details, see [README.md](./README.md).

## When to Use

Use this package when the user needs:

- Structured JSON logging
- Console output (simple for dev, JSON for production)
- MongoDB logging
- File logging
- Request-scoped child loggers
- Per-transport log levels
- Log redaction (passwords, tokens, etc.)

## Workspace Usage (Nexus monorepo)

In the Nexus monorepo, add as a workspace dependency:

```bash
pnpm add @util/logger --filter app
```

Then in your app bootstrap:

```typescript
import { Logger } from "@util/logger";

await Logger.create({
  level: "info",
  transports: [{ type: "console", format: "simple" }],
});

const logger = Logger.getInstance();
logger.info("Server started");
```

## Vendoring

To vendor this package into another project, sparse checkout + copy. Replace `<NEXUS_REF>` with a git tag (preferred) or `main`.

```bash
NEXUS_REF="<git-tag-or-main>"
TMPDIR=$(mktemp -d)
git clone --depth 1 --branch "$NEXUS_REF" --filter=blob:none --sparse \
  <nexus-repo-url> "$TMPDIR"
cd "$TMPDIR" && git sparse-checkout set packages/util-logger
cp -r "$TMPDIR/packages/util-logger" <your-project>/packages/util-logger
rm -rf "$TMPDIR"
```

### After vendoring

```bash
cd packages/util-logger
pnpm install
pnpm run build
```

If using MongoDB transport:

```bash
pnpm add mongodb
```

Follow **project-context** (Chores) — install at latest version unless compatibility requires otherwise.

### Provenance file

After vendoring, create `packages/util-logger/.vendor.json`:

```json
{
  "source": "<nexus-repo-url>",
  "package": "packages/util-logger",
  "tag": "<git-tag-or-main>",
  "vendoredAt": "<ISO-8601 date>",
  "forked": false
}
```

### Updating

Re-run the sparse checkout commands above with the new `NEXUS_REF`, then:

```bash
cd packages/util-logger && pnpm install && pnpm run build
```

Update `.vendor.json` with the new `tag` and `vendoredAt`.

## Quick usage (vendored path)

```typescript
import { Logger } from "@util/logger";

// Bootstrap: await create() initializes and stores the singleton.
await Logger.create({ transports: [{ type: "console" }] });
const logger = Logger.getInstance();
logger.info("Server started");

// Elsewhere: retrieve the same instance.
const same = Logger.getInstance();
```

See [README.md](./README.md) for multi-transport config, child loggers, graceful shutdown, and full API.

## Rules

- Do NOT modify vendored code. Extend via adapters or wrappers in your project code.
- If you must modify, update `.vendor.json` to mark the package as `"forked": true`.
- Connection strings for MongoDB should come from environment variables (passed from app), never hardcoded.
- Call `await Logger.create(config)` before `getInstance()` — `create()` is async.
