# @utils/secret-manager-aws

AWS Secrets Manager provider with singleton pattern. Fetches all secrets or a subset by secret IDs.

## Install

```bash
pnpm add @utils/secret-manager-aws
```

AWS credentials via env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) or config.

## Quick Start

```typescript
import { AwsSecretManager } from "@utils/secret-manager-aws";

// Bootstrap (once)
await AwsSecretManager.create({
  region: process.env.AWS_REGION ?? "us-east-1",
});

// Usage
const secrets = await AwsSecretManager.getInstance().getSecrets();
console.log(secrets.db_password, secrets.api_key);
```

## Infrastructure setup

This package wraps AWS Secrets Manager; it does **not** create AWS resources. You must provision and configure Secrets Manager in your AWS account.

- **AWS prerequisites:**
  - An AWS account with Secrets Manager enabled.
  - At least one secret created (for example `nexus/app/config`).
  - IAM role or user with permissions to `secretsmanager:GetSecretValue` for the relevant secrets.
- **Credentials & region:**
  - Recommended: configure IAM role for the runtime environment (ECS task role, Lambda role, EC2 instance profile).
  - Local/dev: use `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and optionally `AWS_SESSION_TOKEN`.
  - In all cases, pass `region` (and `credentials` if you do not use roles) from the app into `AwsSecretManager.create`.
- **Local testing without AWS:**
  - Use LocalStack:
    ```bash
    docker run -d --name localstack -p 4566:4566 localstack/localstack
    export AWS_ENDPOINT_URL="http://localhost:4566"
    export AWS_REGION="us-east-1"
    export AWS_ACCESS_KEY_ID="test"
    export AWS_SECRET_ACCESS_KEY="test"
    ```
  - Create test secrets via AWS CLI pointed at LocalStack, then run the app tests.

This package is typically used by the app to hydrate configuration for other util packages (for example MongoDB URI, Redis URL, JWT secrets) before passing config into those packages.

## Singleton

```typescript
// At bootstrap
await AwsSecretManager.create({ region: "us-east-1" });

// Elsewhere
const manager = AwsSecretManager.getInstance();
const secrets = await manager.getSecrets(["my-secret-id"]);
```

## Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  await AwsSecretManager.getInstance().close();
  process.exit(0);
});
```

## API

### AwsSecretManager class

| Method                             | Signature                                                        | Description                                 |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| `AwsSecretManager.create(config?)` | `(config?: AwsSecretManagerConfig) => Promise<AwsSecretManager>` | Creates singleton                           |
| `AwsSecretManager.getInstance()`   | `() => AwsSecretManager`                                         | Returns instance; throws if not initialized |
| `getSecrets(secretIds?)`           | `(secretIds?: string[]) => Promise<Record<string, string>>`      | Fetches secrets (all if secretIds omitted)  |
| `close()`                          | `() => Promise<void>`                                            | Clears singleton, destroys client           |

### SecretManager (interface)

Shared contract for all providers (AWS, Azure). Implement this when adding new providers:

```typescript
type SecretManager = {
  getSecrets: (secretIds?: string[]) => Promise<Record<string, string>>;
  close: () => Promise<void>;
};
```

### AwsSecretManagerConfig

| Field         | Type                                              | Default       | Description                   |
| ------------- | ------------------------------------------------- | ------------- | ----------------------------- |
| `region`      | `string`                                          | `"us-east-1"` | AWS region                    |
| `credentials` | `{ accessKeyId, secretAccessKey, sessionToken? }` | from env      | Optional explicit credentials |

## Package Structure

```
packages/utils-secret-manager-aws/
├── docs/plan.md
├── src/
│   ├── helpers/build-client.util.ts
│   ├── interfaces.ts
│   ├── types.ts
│   ├── constants.ts
│   ├── aws-secret-manager.ts
│   ├── aws-secret-manager.test.ts
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
pnpm lint
```

## Test Dockers

Unit tests run without AWS. For integration tests, use LocalStack:

```sh
docker run -d --name localstack -p 4566:4566 localstack/localstack
# Set AWS_ENDPOINT_URL=http://localhost:4566 and credentials
```
