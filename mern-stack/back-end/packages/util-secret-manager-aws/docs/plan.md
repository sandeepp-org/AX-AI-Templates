# @util/secret-manager-aws Design Plan

## Problem Definition

Applications need to retrieve and manage secrets (API keys, DB credentials, tokens) stored in AWS Secrets Manager. The package wraps the AWS SDK behind a singleton with a provider-agnostic `SecretManager` interface so future providers (e.g. `@util/secret-manager-azure`) share the same contract.

## Goal

- Expose `AwsSecretManager` with singleton: `createInstance()`, `getInstance()`, `getSecrets()`, `setSecret()`, `close()`
- Use `@aws-sdk/client-secrets-manager` for ListSecrets and GetSecretValue
- When `secretIds` omitted: list all secrets and fetch each value
- When `secretIds` provided: fetch only those secrets

## Requirements

1. Singleton lifecycle — `createInstance()`, `getInstance()`, `close()` follow the same pattern as other `@util/*` packages.
2. Parallel secret fetching — `getSecrets()` fetches all requested secrets concurrently via `Promise.all`.
3. Selective error handling — `#getSecretValue` returns `null` only for `ResourceNotFoundException`; all other AWS errors propagate.
4. Create-or-update semantics — `setSecret()` attempts `PutSecretValue` first, falls back to `CreateSecret` on `ResourceNotFoundException`.
5. Provider-agnostic interface — `SecretManager` and `SecretManagerFactory` types exported for downstream consumers.

## Architecture

- `AwsSecretManager` implements `SecretManager` interface
- Static `#instance` for singleton
- Private constructor; `createInstance(config)` builds client and sets instance
- `getSecrets(secretIds?)` returns `Record<string, string>`

## SecretManager Interface

All secret manager providers must implement:

**Instance** (`SecretManager`):

```typescript
type SecretManager = {
  getSecrets: (secretIds?: string[]) => Promise<Record<string, string>>;
  setSecret: (secretId: string, value: string) => Promise<void>;
  close: () => Promise<void>;
};
```

**Factory** (`SecretManagerFactory<Config>`):

```typescript
type SecretManagerFactory<Config = unknown> = {
  createInstance: (config?: Config) => Promise<SecretManager>;
  getInstance: () => SecretManager;
};
```

Future `@util/secret-manager-azure` should implement both for consistent API.

## Package Structure

```
packages/util-secret-manager-aws/
├── docs/plan.md
├── src/
│   ├── helpers/
│   │   └── build-client.util.ts
│   ├── interfaces.ts          # SecretManager (shared contract)
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

## Phases

### Phase 1 — Core (complete)

- Singleton lifecycle (`createInstance`, `getInstance`, `close`)
- `getSecrets()` with optional ID list
- `setSecret()` with create-or-update fallback
- `buildSecretsManagerClient` helper

### Phase 2 — Hardening (complete)

- `#getSecretValue` error handling: only `ResourceNotFoundException` returns null, all other errors propagate
- `getSecrets()` parallel fetching via `Promise.all`

### Phase 3 — Integration tests (requires AWS credentials)

- `getSecrets()` against real AWS / LocalStack
- `setSecret()` create + update flow
- `getSecrets([])` listing all secrets

## Test Plan

| Area                           | Covered | Notes                                                   |
| ------------------------------ | ------- | ------------------------------------------------------- |
| Singleton lifecycle            | Yes     | `createInstance`, `getInstance`, `close`, reinit        |
| `getSecrets` error propagation | Yes     | Fake credentials → non-ResourceNotFoundException throws |
| `setSecret` error propagation  | Yes     | Fake credentials → throws                               |
| `buildSecretsManagerClient`    | Yes     | Empty config, region, credentials                       |
| `getSecrets` real AWS          | No      | Requires AWS credentials or LocalStack                  |
| `setSecret` real AWS           | No      | Requires AWS credentials or LocalStack                  |

## Test Docker

Unit tests use fake credentials; they verify singleton and error behavior. Integration tests require real AWS Secrets Manager or LocalStack:

```sh
docker run -d --name localstack -p 4566:4566 localstack/localstack
# Configure AWS credentials to point at LocalStack
```

## Decision Log

| #   | Decision                                                       | Rationale                                                                                            |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `ResourceNotFoundException` → null, all other errors propagate | Silent swallowing hid auth/network failures; only "not found" is a valid null case                   |
| 2   | `Promise.all` for parallel secret fetching                     | Sequential loop was O(n × latency); parallel is O(latency)                                           |
| 3   | Keep `createInstance` naming (not `create`)                    | Matches `SecretManagerFactory` interface; changing would break the contract                          |
| 4   | Fake-credential tests for error propagation                    | Validates that non-ResourceNotFoundException errors are no longer swallowed without needing real AWS |
