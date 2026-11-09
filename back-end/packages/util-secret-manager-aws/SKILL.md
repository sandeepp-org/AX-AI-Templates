---
name: util-secret-manager-aws
description: AWS Secrets Manager provider with singleton pattern. Fetches all secrets or subset by IDs. Use when the app needs secrets from AWS Secrets Manager.
metadata:
  author: aatmix
  version: "0.0.1"
  path: packages/util-secret-manager-aws
---

# @util/secret-manager-aws

AWS Secrets Manager provider with singleton pattern for Node.js/TypeScript projects.

For full API reference, see [README.md](./README.md).

## When to Use

- Fetch secrets from AWS Secrets Manager at app startup
- Import `SecretManager` interface for dependency injection or to implement future providers (e.g. Azure Key Vault)
- Singleton instance shared across the app
- Fetch all secrets or a specific subset by IDs

## Workspace Usage (Nexus monorepo)

```bash
pnpm add @util/secret-manager-aws --filter app
```

## Quick Usage

```typescript
import { AwsSecretManager } from "@util/secret-manager-aws";

await AwsSecretManager.create({
  region: process.env.AWS_REGION ?? "us-east-1",
});
const secrets = await AwsSecretManager.getInstance().getSecrets();
```

## Rules

- Secrets must be fetched at app bootstrap and passed into packages — packages do not fetch secrets themselves.
- AWS region and credentials must come from environment variables, never hardcoded.
