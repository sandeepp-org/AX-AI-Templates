---
name: util-error-normalizer
description: Framework-agnostic error modeling and normalization. Provides shared strongly-typed error classes and a normalized error structure for logging or API responses. Use when you need consistent error shapes across apps or services.
metadata:
  author: aatmix
  version: "0.1.0"
  path: packages/util-error-normalizer
---

# @util/error-normalizer

Framework-agnostic error modeling and normalization utilities for Node.js/TypeScript projects.

For full API reference see [README.md](./README.md).

## When to Use

Use this package when you need:

- Shared, strongly-typed error classes across multiple apps or services
- A normalized error structure for logging or API responses
- Framework-agnostic error handling that does not depend on Express or specific HTTP libraries

## Workspace Usage (Nexus monorepo)

```bash
pnpm add @util/error-normalizer --filter app
```

## Rules

- Do not couple error classes to any specific HTTP framework.
- Error shapes should be serializable (no circular references, no class instances in payload).
